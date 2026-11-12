import z from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(255, "Password is too long"),
});

export const defaultLogin = {
  email: "",
  password: "",
};

export const resetPasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(6, "Minimum 6 characters required")
      .max(255, "Too long"),

    confirm_password: z
      .string()
      .min(6, "Minimum 6 characters required")
      .max(255, "Too long"),
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirm_password"],
      });
    }
  });

export const defaultResetPassword = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

export type LoginFrom = z.infer<typeof loginSchema>;

export type ResetPasswordFrom = z.infer<typeof resetPasswordSchema>;
