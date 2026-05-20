import { z } from "zod";

export const projectIdParamsSchema = z.object({
  projectId: z.coerce.number().int().positive()
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required"),
  description: z.string().trim().optional().nullable(),
  createdByPersonId: z.coerce.number().int().positive()
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").optional(),
  description: z.string().trim().optional().nullable(),
  createdByPersonId: z.coerce.number().int().positive().optional()
});
