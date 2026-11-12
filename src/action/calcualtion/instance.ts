import { CalculationAction } from "./CalculationAction";

/**
 * Shared stateless instance for callers outside React.
 *
 * `CalculationAction` mutates nothing, so one instance is enough for places
 * that cannot call a hook — exported helpers, table cell renderers, receipt and
 * PDF builders. Inside a component prefer `useCalculateAction()`.
 */
export const calculate = new CalculationAction();