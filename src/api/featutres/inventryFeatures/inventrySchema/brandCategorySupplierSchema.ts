import z from "zod";

export const brandSchema = z.object({
  brand_name: z.string().min(1, "Brand name is required").max(255, "Too long"),
  status: z.boolean().default(true),
});

export const supplierSchema = z.object({
  supplier_name: z.string().min(1, "Supplier name is required").max(255),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address too long"),
  primary_no: z.string().min(1, "Primary number is required").max(30),
  secondary_no: z.string().optional(),
  status: z.boolean().default(true),
});

export const categorySchema = z.object({
  category: z
    .string()
    .min(1, "Category name is required")
    .max(255, "Category name must not exceed 255 characters"),
  status: z.boolean().default(true),
});

export type BrandForm = z.infer<typeof brandSchema>;
export type SupplierForm = z.infer<typeof supplierSchema>;
export type CategoryForm = z.infer<typeof categorySchema>;
