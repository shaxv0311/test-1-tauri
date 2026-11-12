import { HelperChild } from "./helper";

/** Mirrors the `discount_type` column / the DISCOUNT_OPTIONS select. */
export type DiscountType = "none" | "percentage" | "amount";

/**
 * Discount arithmetic.
 *
 * Note this is applied AFTER tax on an invoice, to the tax-inclusive gross
 * (invoice.service.ts:179-187). Purchases discount the pre-tax line instead —
 * see `PurCal.lineTotals`. Mixing the two up is the classic way these two
 * screens end up disagreeing on a total.
 */
export class Discount extends HelperChild {
  /**
   * Mirrors invoice.service.ts:179-187:
   *   - percentage is capped at 100%
   *   - an absolute amount is clamped to the base, so the total can never
   *     go negative
   *   - anything <= 0 or an unrecognised type is no discount
   */
  amount(base: unknown, type: unknown, value: unknown): number {
    const entered = this.num(value);
    if (entered <= 0) return 0;

    const total = this.round(this.num(base));
    if (total <= 0) return 0;

    if (type === "percentage") {
      return this.round(total * (Math.min(entered, 100) / 100));
    }
    if (type === "amount") {
      return Math.min(entered, total);
    }
    return 0;
  }

  /** Whether the document carries a discount worth showing on a receipt. */
  hasDiscount(type: unknown, value: unknown): boolean {
    return type !== "none" && this.num(value) > 0;
  }

  /** Receipt label, matching the wording already used on the invoice. */
  label(type: unknown, value: unknown): string {
    return type === "percentage" ? `Discount (${this.num(value)}%)` : "Discount";
  }
}