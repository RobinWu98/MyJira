import { z } from "zod";

export const personIdParamsSchema = z.object({
  personId: z.coerce.number().int().positive()
});

export const userRoleSchema = z.enum(["ADMIN", "MANAGER", "USER"]);

export const createPersonSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  contactNumber: z.string().trim().optional().nullable(),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  role: userRoleSchema,
  password: z.string().min(6)
});

export const updatePersonSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  contactNumber: z.string().trim().optional().nullable(),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  role: userRoleSchema
});
