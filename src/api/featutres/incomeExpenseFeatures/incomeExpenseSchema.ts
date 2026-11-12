import z from "zod";
import { formatDateDMY } from "../../../helper/date";

export const incomeExpenseSchema = z.object({
  amount: z
    .number({ message: "Amount is required" })
    .min(0, "Amount cannot be negative"),
  type: z.enum(["income", "expense"]),
  description: z.string().trim().optional(),
  date: z.string().date("Invalid date"),
});

export type IncomeExpenseForm = z.infer<typeof incomeExpenseSchema>;
