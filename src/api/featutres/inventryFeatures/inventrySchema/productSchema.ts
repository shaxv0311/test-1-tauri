import z from "zod";

const productOptionSchema = z.object({
  label: z.string(),
  value: z.number(),
});

const stockBatchSchema = z.object({
  batch_no: z
    .string()
    .max(100, "Batch no must not exceed 100 characters")
    .optional(),
  pack: z
    .number({ message: "Pack size is required" })
    .int("Pack size must be a whole number")
    .min(1, "Pack size must be at least 1"),
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  expiry_date: z.string().optional(),
  manual_entry: z.boolean().optional(),
  stock_status: z.string().optional(),
});

export const productSchema = z.object({
  product_name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must not exceed 255 characters"),

  hsn_code: z
    .string()
    .max(50, "HSN code must not exceed 50 characters")
    .optional()
    .default(""),

  category: productOptionSchema
    .nullable()
    .superRefine((val, ctx) => {
      if (!val || val.value < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Category is required",
          path: ["value"],
        });
      }
    }),

  brand: productOptionSchema.nullable(),

  mrp: z
    .number({ message: "MRP is required" })
    .min(0, "MRP cannot be negative")
    .nullable()
    .refine((val) => val !== null && !Number.isNaN(val), "MRP is required"),

  buy_price: z
    .number({ message: "Buy price is required" })
    .min(0, "Buy price cannot be negative")
    .nullable()
    .refine((val) => val !== null && !Number.isNaN(val), "Buy price is required"),

  sell_price: z
    .number({ message: "Sell price is required" })
    .min(0, "Sell price cannot be negative")
    .nullable()
    .refine(
      (val) => val !== null && !Number.isNaN(val),
      "Sell price is required",
    ),

  status: z.boolean(),

  stock: z.array(stockBatchSchema).default([]),
});

export type ProductForm = z.infer<typeof productSchema>;
export type StockBatchForm = z.infer<typeof stockBatchSchema>;

export const defaultStockBatch: StockBatchForm = {
  batch_no: "",
  pack: 1,
  quantity: 0,
  expiry_date: "",
  manual_entry: true,
};

export const defaultProduct: ProductForm = {
  product_name: "",
  hsn_code: "",
  category: null,
  brand: null,
  mrp: null as any,
  buy_price: null as any,
  sell_price: null as any,
  status: true,
  stock: [],
};
