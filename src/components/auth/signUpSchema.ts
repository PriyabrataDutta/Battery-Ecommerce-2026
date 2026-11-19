import { z } from "zod";
import { INVALID_MOBILE, normalizeIndianMobile } from "@/lib/phone";

/** Password rules for every place a password is set (sign-up, reset, change). */
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

/** Sign-up form rules (Supabase also enforces its own minimum password length). */
export const signUpSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name")
      .max(80, "Name is too long")
      .regex(/^[\p{L}\s.'’-]+$/u, "Use letters only"),
    phone: z.string().transform((v, ctx) => {
      const n = normalizeIndianMobile(v);
      if (!n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: INVALID_MOBILE });
      return n ?? v;
    }),
    email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match" })
  .refine((v) => !v.password.toLowerCase().includes(v.email.split("@")[0]) || v.email.split("@")[0].length < 4, {
    path: ["password"],
    message: "Password must not contain your email name",
  });
