import { z } from "zod";

const optionSchema = z.object({
  label: z.string(),
  value: z.number(),
  raw: z.any().optional(),
});

const quantitySchema = z
  .number({ message: "Quantity is required" })
  .min(1, "Quantity must be at least 1");

const priceSchema = z
  .number({ message: "Amount is required" })
  .min(0, "Amount cannot be negative");

/** A line dispensed from inventory — needs a product AND a stock batch. */
export const inVoiceItemSchema = z.object({
  stock_type: z.literal("stock"),
  productId: z
    .number({ message: "Product is required" })
    .min(1, "Product is required"),
  /** Stock batch the sale is dispensed from — required by the invoice API. */
  stockId: z
    .number({ message: "Stock batch is required" })
    .min(1, "Stock batch is required"),
  product_name: z.string().optional(),
  /** Batch number, kept for display only — the API stores the stock id. */
  batch_no: z.string().optional(),
  /** Expiry date of the selected batch — for display & print only. */
  expiry_date: z.string().optional(),
  quantity: quantitySchema,
  price: priceSchema,
});

export const inVoiceSchema = z.object({
  invoice_no: z.string().optional(),
  customer_name: z.string().default(""),
  doctor_name: z.string().default(""),
  phone_no: z.string().default(""),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().default(""),
  invoice_date: z.string().default(new Date().toISOString().split("T")[0]),
  items: z.array(inVoiceItemSchema).min(1, "At least one item is required"),
  /** "none" means no discount is applied or sent. */
  discount_type: z.enum(["none", "percentage", "amount"]).default("none"),
  discount: z.number().min(0, "Discount cannot be negative").default(0),
  /**
   * "none" → the whole bill is untaxed. "percentage" → `gst` applies to every
   * line, which is what the API stores per item.
   */
  tax_type: z.enum(["none", "percentage"]).default("none"),
  gst: z
    .number()
    .min(0, "Tax cannot be negative")
    .max(100, "Tax cannot exceed 100")
    .default(18),
});

export const defaultInvoice = {
  invoice_no: "",
  customer_name: "",
  doctor_name: "",
  phone_no: "",
  email: "",
  address: "",
  invoice_date: new Date().toISOString().split("T")[0],
  items: [] as InvoiceItem[],
  discount_type: "none" as "none" | "percentage" | "amount",
  discount: 0,
  tax_type: "none" as "none" | "percentage",
  gst: 18,
};

export type InvoiceItem = z.infer<typeof inVoiceItemSchema>;
export type InvoiceForm = z.infer<typeof inVoiceSchema>;
