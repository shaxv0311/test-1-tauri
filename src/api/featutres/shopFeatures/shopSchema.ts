import { z } from "zod";

export const shopSchema = z.object({
  shop_name: z
    .string()
    .trim()
    .min(1, "Shop name is required")
    .max(100, "Shop name must be 100 characters or less"),

  phone: z.string().min(1, "Phone number is required"),

  gstin: z.string().trim().optional(),

  dl_no: z.string().trim().optional(),

  /**
   * GST master switch. Held in the form (rather than only on the Settings
   * toggle) because the API treats an omitted field as "leave unchanged" — the
   * store form must still send it so saving an unrelated edit cannot silently
   * clear it.
   */
  gst: z.boolean().default(false),

  status: z.boolean().default(true),

  /**
   * The shop owner is always the signed-in user (from the JWT) — it is never
   * sent by the client and so is not part of the form.
   */

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .or(z.literal(""))
    .optional(),

  logo: z.any().optional(),

  //   website: z
  //     .string()
  //     .trim()
  //     .url("Enter a valid URL (e.g. https://www.example.com)")
  //     .or(z.literal(""))
  //     .optional(),

  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must be 500 characters or less"),
});

export type ShopForm = z.infer<typeof shopSchema>;

/**
 * Typed explicitly: `logo` is intentionally `any` (a File in FormData) and
 * `userId` is an optional nullable, so an untyped literal widens both and the
 * form no longer type-checks against `ShopForm`.
 */
export const defaultShop: ShopForm = {
  shop_name: "",
  phone: "",
  email: "",
  logo: null,
  //   website: "",
  address: "",
  gstin: "",
  dl_no: "",
  gst: false,
  status: true,
};
