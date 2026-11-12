import { z } from "zod";

/**
 * Mirrors `createSalesReplaceSchema` on the server, which is
 * `additionalProperties: false` — anything not declared here would be rejected
 * with a 400, so the form must not add extra fields to the payload.
 */
export const salesReplaceSchema = z.object({
  productId: z
    .number({ message: "Product is required" })
    .min(1, "Product is required"),

  /** Stock batch the replacement is booked against — required by the API. */
  stockId: z
    .number({ message: "Stock batch is required" })
    .min(1, "Stock batch is required"),

  /**
   * Pieces added back to the batch. This is a positive movement, so there is no
   * ceiling — only batches that still exist and belong to the product qualify.
   */
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),

  /**
   * The amount booked as an expense. It is the **total** for this replacement,
   * not a per-piece rate — the server writes it straight into `income_expense`
   * as `amount`.
   */
  price: z
    .number({ message: "Price is required" })
    .min(0, "Price cannot be negative"),

  /** `maxLength: 255` on the API. Empty means the server uses its own default. */
  description: z.string().trim().max(255, "Description must be 255 characters or less").optional(),
});

export type SalesReplaceForm = z.infer<typeof salesReplaceSchema>;

export const defaultSalesReplace: SalesReplaceForm = {
  productId: 0,
  stockId: 0,
  quantity: 1,
  price: 0,
  description: "",
};