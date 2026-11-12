import { SimpleHelper } from "../../abstract/SimpleHelper";
import { CalculationAction } from "./CalculationAction";

/**
 * Base for every calculation group hanging off `CalculationAction`.
 *
 * The three numeric primitives live on the parent so that a component can also
 * call `calc.formatCurrency(...)` directly; the protected shorthands below keep
 * the subclasses readable without repeating `this.p.` on every operation.
 */
export class HelperChild extends SimpleHelper<CalculationAction> {
  /** Coerce a possibly-string / possibly-null input to a finite number. */
  protected num(value: unknown): number {
    return this.p.toNumber(value);
  }

  /** Round a monetary value to 2dp exactly like the backend. */
  protected round(value: number): number {
    return this.p.round2(value);
  }

  /** Format for display, e.g. `₹1,23,456.00`. */
  protected money(value: unknown): string {
    return this.p.formatCurrency(value);
  }
}