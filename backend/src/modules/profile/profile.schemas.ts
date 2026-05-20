import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contactNumber: z.string().trim().optional().nullable()
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6)
  })
  .refine((input) => input.newPassword === input.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });
