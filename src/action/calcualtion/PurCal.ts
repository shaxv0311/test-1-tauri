import { HelperChild } from "./helper";

/** A purchase line, as held in the Add Purchase field array. */
export interface PurchaseLine {
  buy_price: number | string;
  quantity: number | string;
  discount?: number | string | null;
  gst?: number | string | null;
  /** Present on lines loaded from the API rather than freshly entered. */
  net_value?: number | string | null;
  pack?: number | string | null;
}

export interface PurchaseLineTotals {
  gross: number;
  discountAmount: number;
  taxable: number;
  gstAmount: number;
  netValue: number;
}

export type PaymentStatus = "Paid" | "Partial" | "Unpaid";

export interface PaymentSplit {
  remainingDue: number;
  paymentStatus: PaymentStatus;
}

/**
 * Purchase arithmetic.
 *
 * Purchases discount the PRE-tax line and then add GST (the invoice side does
 * the opposite — discount after tax). See purchase.service.ts:141-152.
 */
export class PurCal extends HelperChild {
  /**
   * Mirrors purchase.service.ts:141-152:
   *   gross    = round2(buy_price * quantity)
   *   disc_amt = round2(gross * discount%)
   *   taxable  = round2(gross - disc_amt)
   *   gst_amt  = round2(taxable * gst%)
   *   net      = round2(taxable + gst_amt)
   *
   * `pack` is deliberately NOT part of this: buy_price is already the price
   * per pack and quantity is the number of packs ordered (the backend comment
   * at line 144-145 says so explicitly). PurchaseViewModel.tsx used to
   * multiply by pack here, which doubled every purchase total.
   *
   * Pass the persisted `net_value` for lines loaded from the API so a stored
   * figure is never silently recomputed from a possibly stale price.
   */
  lineTotals(line: PurchaseLine): PurchaseLineTotals {
    const stored = this.num(line?.net_value);
    if (line?.net_value !== null && line?.net_value !== undefined) {
      return {
        gross: stored,
        discountAmount: 0,
        taxable: stored,
        gstAmount: 0,
        netValue: stored,
      };
    }

    const gross = this.round(this.num(line?.buy_price) * this.num(line?.quantity));
    const discountAmount = this.round(gross * (this.num(line?.discount) / 100));
    const taxable = this.round(gross - discountAmount);
    const gstAmount = this.round(taxable * (this.num(line?.gst) / 100));

    return {
      gross,
      discountAmount,
      taxable,
      gstAmount,
      netValue: this.round(taxable + gstAmount),
    };
  }

  /** Net value of a single line. Replaces the local `getItemNet` copy. */
  lineNet(line: PurchaseLine): number {
    return this.lineTotals(line).netValue;
  }

  /** Summed net across every line — purchase.service.ts:141. */
  itemsTotal(lines: PurchaseLine[]): number {
    return this.round(
      (lines ?? []).reduce((acc, line) => acc + this.lineNet(line), 0),
    );
  }

  /**
   * Remaining due and payment status. Mirrors derivePaymentStatus in
   * purchase.service.ts:74-79, which is an exact comparison — the previous
   * frontend used a `|remaining| < 0.01` tolerance and could therefore show
   * "Partial" on a bill the API had already marked "Paid".
   */
  payment(total: unknown, paid: unknown): PaymentSplit {
    const totalAmount = this.round(this.num(total));
    const paidAmount = this.num(paid);
    const remainingDue = this.round(totalAmount - paidAmount);

    const paymentStatus: PaymentStatus =
      paidAmount <= 0 ? "Unpaid" : paidAmount >= totalAmount ? "Paid" : "Partial";

    return { remainingDue, paymentStatus };
  }

  /** Total pieces a purchase adds to a batch. Mirrors purchase.service.ts:208-211. */
  batchTotalQuantity(line: PurchaseLine, freeQuantity: unknown): number {
    return this.num(line?.pack ?? 1) * (this.num(line?.quantity) + this.num(freeQuantity));
  }
}