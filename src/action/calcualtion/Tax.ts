import { HelperChild } from "./helper";

export interface TaxSplit {
  cgst: number;
  sgst: number;
}

/**
 * GST / CGST / SGST arithmetic.
 *
 * The app charges intra-state GST, so CGST and SGST are always an automatic
 * half of GST each — invoice.service.ts:210-212 derives them and never accepts
 * them from the client.
 */
export class Tax extends HelperChild {
  /**
   * Mirrors invoice.service.ts:210-212:
   *   cgst = round2(gst / 2); sgst = round2(gst / 2);
   */
  split(gstPercentage: unknown): TaxSplit {
    const half = this.round(this.num(gstPercentage) / 2);
    return { cgst: half, sgst: half };
  }

  /**
   * Tax due on a pre-tax base, rounded like purchase.service.ts:149.
   *
   * The base is re-rounded first because the backend rounds `taxable` before
   * applying GST — skipping that step is how the old purchase view drifted by
   * a paisa.
   */
  amountOn(base: unknown, gstPercentage: unknown): number {
    return this.round(this.round(this.num(base)) * (this.num(gstPercentage) / 100));
  }

  /**
   * True when GST should be charged at all.
   *
   * `enabled` is the per-document form flag; `shopEnabled` is the shop master
   * switch (products.shop.gst). Both must be on, which is why Quotation.tsx
   * was charging tax on shops that had it turned off.
   */
  shouldCharge({ enabled, shopEnabled }: { enabled: unknown; shopEnabled: unknown }): boolean {
    return Boolean(shopEnabled) && Boolean(enabled);
  }
}