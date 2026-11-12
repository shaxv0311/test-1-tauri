import { Discount } from "./Discount";
import { InvCal } from "./InvCal";
import { PurCal } from "./PurCal";
import { Tax } from "./Tax";

/**
 * Single source of truth for every money / quantity calculation in the
 * renderer.
 *
 * These used to be copy-pasted into eight files, which had already drifted:
 * two different round-2 helpers, six `toNumber` variants, and one purchase
 * view that multiplied a line total by `pack` when the backend does not.
 * Anything that needs arithmetic goes through here so the preview a user sees
 * is the exact figure the API stores.
 *
 * Every method mirrors its backend counterpart — the doc comment on each one
 * names the service and line it was copied from. The instance holds no
 * mutable state, so a single shared instance is safe (see `useCalculateAction`).
 */
export class CalculationAction {
  tax = new Tax(this);
  discount = new Discount(this);
  invCal = new InvCal(this);
  purCal = new PurCal(this);

  toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * Mirrors `round2` in invoice.service.ts:55 and purchase.service.ts:69.
   *
   * Deliberately `toFixed` rather than the `Math.round(v * 100) / 100` that
   * six frontend copies used: the backend is what actually stores the total,
   * so the preview has to round the same way or it disagrees by a paisa.
   */
  round2(value: number): number {
    return parseFloat(value.toFixed(2));
  }

  /**
   * Replaces the five local `formatCurrency` copies and `money` in
   * thermal_templates.ts. Every rupee figure on screen goes through here so
   * the decimals and the `en-IN` grouping are identical everywhere.
   */
  formatCurrency(value: unknown): string {
    return `₹${this.round2(this.toNumber(value)).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}