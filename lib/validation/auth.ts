import { z } from "zod";
import { emailField, nameField, passwordField } from "./common";

export const signUpSchema = z
  .object({
    name: nameField,
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, { message: "Accept the terms to continue" }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const signInSchema = z.object({ email: emailField, password: z.string().min(1, "Enter your password").max(128) });
export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({ token: z.string().min(20, "This link is not valid").max(200), password: passwordField, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ["newPassword"], message: "Choose a password you have not used here" });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password").max(128),
  confirmation: z.string().refine((v) => v === "DELETE", { message: "Type DELETE to confirm" }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
