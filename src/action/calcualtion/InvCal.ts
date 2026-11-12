import { HelperChild } from "./helper";

/** A bill/quotation line, as held in the form field array. */
export interface BillLine {
  quantity: number | string;
  price: number | string;
  gst?: number | string | null;
}

export interface BillTotalsOptions {
  /** Document-wide tax percentage applied to every line. */
  gstPercentage: unknown;
  /** Whether tax is charged at all — the "None" / "Percentage" choice. */
  enabled: unknown;
  discountType: unknown;
  discount: unknown;
}

export interface BillTotals {
  /** Pre-tax sum of the lines. */
  subtotal: number;
  gstAmount: number;
  /** Half of `gstAmount` each — the split a GST invoice is required to show. */
  cgstAmount: number;
  sgstAmount: number;
  /**
   * Tax-inclusive amount. This is what invoice.service.ts calls `subtotal`,
   * because it folds GST into the reduce accumulator (lines 172-176).
   */
  grossAmount: number;
  discountAmount: number;
  finalAmount: number;
}

export interface LineTotals {
  base: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  total: number;
}

export interface BatchLike {
  pack?: number | string | null;
  /** Number of packs on the shelf. */
  quantity?: number | string | null;
  /** Total pieces/tablets; authoritative when present. */
  batch_total_quantity?: number | string | null;
}

/**
 * Invoice + quotation arithmetic, plus the pack/quantity conversion that the
 * billing screens need.
 *
 * Key invariant, and the source of the original billing bug: `sell_price` is
 * stored per PACK, but the invoice API bills per PIECE — invoice.service.ts
 * reduces `price * item.quantity` where `quantity` is pieces
 * (lines 172-176, 214). So the price has to be divided by the pack size
 * before it is ever shown in the Unit Price field, or every line total is
 * inflated by that factor.
 */
export class InvCal extends HelperChild {
  /** ── Pack / quantity conversion ─────────────────────────────────────── */

  /**
   * Tablets per pack. Mirrors the guard in invoice.service.ts:153:
   *   const pack = batch.pack && batch.pack > 0 ? batch.pack : 1;
   */
  batchPack(batch: BatchLike | null | undefined): number {
    return this.num(batch?.pack) > 0 ? this.num(batch?.pack) : 1;
  }

  /**
   * Pieces on hand. Mirrors invoice.service.ts:156-157:
   *   batch.batch_total_quantity ?? (batch.quantity ?? 0) * pack
   */
  batchPieces(batch: BatchLike | null | undefined): number {
    const stored = this.num(batch?.batch_total_quantity);
    return stored > 0 ? stored : this.num(batch?.quantity) * this.batchPack(batch);
  }

  /**
   * Convert a per-pack sell price into the per-piece unit price the invoice
   * API expects. Returns 0 for a missing/zero price so callers can treat it
   * as "no auto-fill available".
   */
  piecePrice(sellPrice: unknown, pack: unknown): number {
    const value = this.num(sellPrice);
    if (value <= 0) return 0;
    return this.round(value / (this.num(pack) > 0 ? this.num(pack) : 1));
  }

  /** Convenience overload: read the pack straight off the batch. */
  piecePriceFromBatch(sellPrice: unknown, batch: BatchLike | null | undefined): number {
    return this.piecePrice(sellPrice, this.batchPack(batch));
  }

  /**
   * Remaining stock after selling `quantitySold` pieces. Mirrors
   * invoice.service.ts:239-243:
   *   newBatchTotal = max(0, batch_total_quantity - quantity)
   *   newQty        = ceil(newBatchTotal / pack)
   * `ceil` (not `round`) is deliberate — it keeps a part-used pack counted.
   */
  batchAfterSale(
    batch: BatchLike | null | undefined,
    quantitySold: unknown,
  ): { batchTotal: number; quantity: number } {
    const pack = this.batchPack(batch);
    const batchTotal = Math.max(0, this.batchPieces(batch) - this.num(quantitySold));
    return { batchTotal, quantity: Math.ceil(batchTotal / pack) };
  }

  /** Whether `quantity` pieces can be sold from `batch`. */
  hasStockFor(batch: BatchLike | null | undefined, quantity: unknown): boolean {
    return this.num(quantity) <= this.batchPieces(batch);
  }

  /** ── Line + document totals ──────────────────────────────────────────── */

  /** Pre-tax line total. Quantity is pieces, price is per-piece. */
  lineBase(line: BillLine): number {
    return this.round(this.num(line?.quantity) * this.num(line?.price));
  }

  /** Mirrors invoice.service.ts:209-216 for a single line. */
  lineTotals(line: BillLine): LineTotals {
    const gstPercentage = this.num(line?.gst);
    const base = this.lineBase(line);
    const gstAmount = this.round(base * (gstPercentage / 100));
    const { cgst, sgst } = this.p.tax.split(gstPercentage);
    return { base, gstAmount, cgst, sgst, total: this.round(base + gstAmount) };
  }

/**
 * Whole-document totals for invoices and quotations.
 *
 * One tax rate applies to the whole bill, set by the Tax dropdown next to
 * Discount. Rounds after every step, as the backend does, so the figure shown
 * in the preview equals the `total_amount` the API writes.
 */
  totals(lines: BillLine[], options: BillTotalsOptions): BillTotals {
    const subtotal = this.round(
      (lines ?? []).reduce((acc, line) => acc + this.lineBase(line), 0),
    );

    const gstAmount = options.enabled
      ? this.round(subtotal * (this.num(options.gstPercentage) / 100))
      : 0;

    // CGST/SGST are each half the GST, matching invoice.service.ts:211-212.
    const cgstAmount = gstAmount > 0 ? this.round(gstAmount / 2) : 0;

    // The discount is applied to the tax-inclusive gross, clamped so the total
    // can never go negative.
    const grossAmount = this.round(subtotal + gstAmount);
    const discountAmount = this.p.discount.amount(
      grossAmount,
      options.discountType,
      options.discount,
    );

    return {
      subtotal,
      gstAmount,
      cgstAmount,
      // Deriving SGST as the remainder keeps the two halves summing exactly to
      // the GST figure even when the split lands on a half-paisa.
      sgstAmount: this.round(gstAmount - cgstAmount),
      grossAmount,
      discountAmount,
      finalAmount: this.round(grossAmount - discountAmount),
    };
  }

  /**
   * Totals for a document that is being re-printed from stored rows.
   *
   * The invoice API stores each line's tax-inclusive `total` plus its own
   * `gst`/`cgst`/`sgst`, and writes the header `total_amount` from those. When
   * those stored values are available they are authoritative: re-deriving the
   * tax from `quantity × price` can disagree with what was actually billed
   * (server-side rounding), which made the printed
   * PDF's arithmetic not add up to its own total.
   *
   * Falls back to the live calculation when the stored figures are missing, so
   * unsaved drafts still preview correctly.
   */
  storedTotals(
    lines: Array<
      BillLine & { total?: number | string | null; cgst?: number | string | null; sgst?: number | string | null }
    >,
    options: BillTotalsOptions,
  ): BillTotals {
    const source = lines ?? [];

    const hasStoredTotals =
      source.length > 0 &&
      source.every((line) => this.num(line?.total) > 0);

    if (!hasStoredTotals) {
      return this.totals(source, options);
    }

    const subtotal = this.round(
      source.reduce((acc, line) => acc + this.lineBase(line), 0),
    );

    // gross = sum of the stored per-line totals, which already include tax.
    const grossAmount = this.round(
      source.reduce((acc, line) => acc + this.num(line?.total), 0),
    );
    const gstAmount = this.round(grossAmount - subtotal);

    const storedCgst = source.reduce((acc, line) => acc + this.num(line?.cgst), 0);
    const storedSgst = source.reduce((acc, line) => acc + this.num(line?.sgst), 0);
    const hasStoredSplit =
      storedCgst > 0 || storedSgst > 0 || gstAmount === 0;

    const cgstAmount = hasStoredSplit
      ? this.round(storedCgst)
      : this.round(gstAmount / 2);

    const discountAmount = this.p.discount.amount(
      grossAmount,
      options.discountType,
      options.discount,
    );

    return {
      subtotal,
      gstAmount,
      cgstAmount,
      sgstAmount: hasStoredSplit
        ? this.round(storedSgst)
        : this.round(gstAmount - cgstAmount),
      grossAmount,
      discountAmount,
      finalAmount: this.round(grossAmount - discountAmount),
    };
  }
}