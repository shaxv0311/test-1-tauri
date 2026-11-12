import { z } from "zod";

const productOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
  raw: z.unknown(),
});

const supplierOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
});

export const purchaseItemSchema = z.object({
  product: productOptionSchema.nullable().superRefine((val, ctx) => {
    if (!val || val.value < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Product is required",
        path: ["value"],
      });
    }
  }),
  batch_no: z.string().default(""),
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  // Kept as a real field: it is sent to the backend for the batch piece
  // count. It is deliberately NOT part of the net cost calculation.
  pack: z
    .number({ message: "Pack size is required" })
    .int("Pack size must be a whole number")
    .min(1, "Pack size must be at least 1"),
  free_quantity: z
    .number({ message: "Free quantity is required" })
    .int("Free quantity must be a whole number")
    .min(0, "Free quantity cannot be negative")
    .default(0),
  mrp: z
    .number({ message: "MRP is required" })
    .min(0, "MRP cannot be negative"),
  buy_price: z
    .number({ message: "Buy price is required" })
    .min(0, "Buy price cannot be negative"),
  sell_price: z
    .number({ message: "Sell price is required" })
    .min(0, "Sell price cannot be negative"),
  discount: z.number().min(0, "Discount cannot be negative").default(0),
  gst: z.number().min(0, "GST cannot be negative").default(0),
  expiry_date: z.string().default(""),
});

export const purchaseSchema = z.object({
  supplier: supplierOptionSchema
    .nullable()
    .superRefine((val, ctx) => {
      if (!val || val.value < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Supplier is required",
          path: ["value"],
        });
      }
    }),
  invoice_no: z.string().min(1, "Purchase number is required"),
  invoice_date: z.string().date("Invalid purchase date"),
  paid_amount: z
    .number({ message: "Paid amount is required" })
    .min(0, "Paid amount cannot be negative"),
  credit_amnt: z
    .number({ message: "Credit amount is required" })
    .min(0, "Credit amount cannot be negative"),
  items: z.array(purchaseItemSchema).min(1, "At least one product is required"),
});

export type PurchaseItem = z.infer<typeof purchaseItemSchema>;
export type PurchaseForm = z.infer<typeof purchaseSchema>;

export const defaultPurchaseItem: PurchaseItem = {
  product: null,
  batch_no: "",
  quantity: 1,
  pack: 1,
  free_quantity: 0,
  mrp: 0,
  buy_price: 0,
  sell_price: 0,
  discount: 0,
  gst: 0,
  expiry_date: "",
};

export const defaultPurchase: PurchaseForm = {
  supplier: null,
  invoice_no: "",
  invoice_date: new Date().toISOString().split("T")[0],
  paid_amount: 0,
  credit_amnt: 0,
  // Lines are added through the item popup, so the purchase starts empty and
  // the "no products" state is what the user actually sees first.
  items: [],
};
