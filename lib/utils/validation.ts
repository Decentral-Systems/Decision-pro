/**
 * Zod validation schemas for forms
 */
import { z } from "zod";
import {
  ethiopianIdValidator,
  ethiopianPhoneValidator,
  formatETB,
  parseETB,
} from "./ethiopianValidators";

// Re-export Ethiopian validators
export const ethiopianPhoneSchema = ethiopianPhoneValidator;
export const ethiopianIdSchema = ethiopianIdValidator;
export { formatETB, parseETB };

// NBE compliance constants

// Login form schema
export const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
