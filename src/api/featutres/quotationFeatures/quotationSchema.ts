import { z } from "zod";

export const quotationItemSchema = z.object({
  product_name: z.string().min(1, "Product/Service name is required"),
  quantity: z
    .number({ message: "Quantity is required" })
    .min(0, "Quantity cannot be negative"),
  price: z
    .number({ message: "Amount is required" })
    .min(0, "Amount cannot be negative"),
});

export const quotationSchema = z.object({
  quotation_no: z.string().optional(),
  customer_name: z.string().min(1, "Customer Name is required"),
  phone_no: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  enable_gst: z.boolean().default(false),
  gst: z.number().min(0).max(100).default(18),
});

export const defaultQuotation: QuotationForm = {
  customer_name: "",
  phone_no: "",
  email: "",
  address: "",
  items: [],
  enable_gst: false,
  gst: 18,
};

export type QuotationItemForm = z.infer<typeof quotationItemSchema>;
export type QuotationForm = z.infer<typeof quotationSchema>;
