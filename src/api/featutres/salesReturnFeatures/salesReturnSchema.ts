import { z } from "zod";

const quantitySchema = z
  .number({ message: "Quantity is required" })
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1");

/**
 * One replacement handed back to the customer. The damaged item they return is
 * not recorded by the API — only what goes out in its place.
 */
export const salesReturnItemSchema = z.object({
  productId: z
    .number({ message: "Product is required" })
    .min(1, "Product is required"),
  /** Stock batch the replacement is dispensed from — required by the API. */
  stockId: z
    .number({ message: "Stock batch is required" })
    .min(1, "Stock batch is required"),
  quantity: quantitySchema,
  /** Kept for display only — the API stores the product/batch ids. */
  product_name: z.string().optional(),
  batch_no: z.string().optional(),
});

/** Max length enforced by the API (`maxLength: 200` on both names). */
const nameSchema = z.string().max(200, "Name must be 200 characters or less");

export const salesReturnSchema = z.object({
  /** Customer the replacement is handed to — optional on the API. */
  patient_name: nameSchema.optional(),
  /** Prescribing doctor — optional on the API. */
  doctor_name: nameSchema.optional(),
  items: z
    .array(salesReturnItemSchema)
    .min(1, "At least one replacement item is required"),
});

export type SalesReturnItem = z.infer<typeof salesReturnItemSchema>;
export type SalesReturnForm = z.infer<typeof salesReturnSchema>;

export const defaultSalesReturn: SalesReturnForm = {
  patient_name: "",
  doctor_name: "",
  items: [],
};
