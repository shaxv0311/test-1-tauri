import { z } from "zod";

/**
 * One line of a pickup order.
 *
 * `price` is the per-piece rate and `gst` is the whole GST percentage — the
 * API splits it into CGST/SGST itself. `product_name` / `batch_no` are kept for
 * display only; the API stores the product and batch ids.
 */
export const pickupOrderItemSchema = z.object({
  productId: z
    .number({ message: "Product is required" })
    .min(1, "Product is required"),
  stockId: z
    .number({ message: "Stock batch is required" })
    .min(1, "Stock batch is required"),
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1"),
  price: z
    .number({ message: "Price is required" })
    .min(0, "Price cannot be negative"),
  gst: z
    .number({ message: "GST is required" })
    .min(0, "GST cannot be negative"),
  product_name: z.string().optional(),
  batch_no: z.string().optional(),
});

export const pickupOrderSchema = z.object({
  customerName: z
    .string({ message: "Customer name is required" })
    .trim()
    .min(1, "Customer name is required")
    .max(200, "Customer name must be 200 characters or less"),
  doctorName: z
    .string()
    .max(200, "Doctor name must be 200 characters or less")
    .default(""),
  phone_no: z
    .string({ message: "Phone number is required" })
    .trim()
    .min(1, "Phone number is required")
    .max(50, "Phone number must be 50 characters or less"),
  email: z
    .string()
    .email("Invalid email address")
    .max(100, "Email must be 100 characters or less")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(500, "Address must be 500 characters or less")
    .default(""),
  orderDate: z.string().optional(),
  items: z
    .array(pickupOrderItemSchema)
    .min(1, "At least one item is required"),
});

export type PickupOrderItem = z.infer<typeof pickupOrderItemSchema>;
export type PickupOrderForm = z.infer<typeof pickupOrderSchema>;

export const defaultPickupOrder: PickupOrderForm = {
  customerName: "",
  doctorName: "",
  phone_no: "",
  email: "",
  address: "",
  orderDate: "",
  items: [],
};
