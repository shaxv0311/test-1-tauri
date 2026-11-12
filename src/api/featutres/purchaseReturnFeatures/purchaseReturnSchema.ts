import { z } from "zod";

/**
 * One replacement line received back from the supplier.
 *
 * Unlike a sales return this carries no `stockId` — the API matches the batch by
 * `batch_no`, topping up an existing batch or creating a new one. Damaged goods
 * handed back to the supplier are not recorded by the API, so only the
 * replacement stock received is captured here.
 */
export const purchaseReturnItemSchema = z.object({
  productId: z
    .number({ message: "Product is required" })
    .min(1, "Product is required"),
  /** Units per pack; the piece count is `pack × quantity` server-side. */
  pack: z
    .number({ message: "Pack size is required" })
    .int("Pack size must be a whole number")
    .min(1, "Pack size must be at least 1"),
  /** Number of packs received from the supplier. */
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  /** Max length enforced by the API (`maxLength: 100`). */
  batch_no: z.string().max(100, "Batch no must be 100 characters or less"),
  /** Omitted when blank — the API rejects an empty date string. */
  expiry_date: z.string().optional(),
});

/**
 * Mirrors the create body. `supplierId` is optional on the API, so it stays
 * nullable here rather than being required.
 */
export const purchaseReturnSchema = z.object({
  supplierId: z.number().min(1, "Invalid supplier").nullable().optional(),
  replacementItems: z
    .array(purchaseReturnItemSchema)
    .min(1, "At least one replacement item is required"),
});

export type PurchaseReturnPayload = z.infer<typeof purchaseReturnSchema>;
export type PurchaseReturnItem = z.infer<typeof purchaseReturnItemSchema>;