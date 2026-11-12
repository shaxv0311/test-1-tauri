import { useMemo } from "react";

import { CalculationAction } from "../action/calcualtion";

/**
 * Entry point for all money / quantity maths in the renderer.
 *
 * ```tsx
 * const calc = useCalculateAction();
 * const { subtotal, finalAmount } = calc.invCal.totals(fields, options);
 * ```
 *
 * `CalculationAction` is stateless, so this deliberately returns one memoised
 * instance rather than building a new tree on every render. Nothing here is
 * React state — it is a pure calculation layer, kept out of the component so
 * the same arithmetic can be reused outside a component (PDF/receipt
 * builders, table cells, export helpers) without a hook.
 */
export const useCalculateAction = (): CalculationAction =>
  useMemo(() => new CalculationAction(), []);