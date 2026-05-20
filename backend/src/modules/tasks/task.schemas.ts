import { z } from "zod";

export const taskIdParamsSchema = z.object({
  taskId: z.coerce.number().int().positive()
});

export const projectTaskParamsSchema = z.object({
  projectId: z.coerce.number().int().positive()
});

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const taskPrioritySchema = z.enum(["HIGH", "NORMAL", "LOW"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required"),
  description: z.string().trim().optional().nullable(),
  assignedPersonId: z.coerce.number().int().positive().optional().nullable(),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("NORMAL")
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").optional(),
  description: z.string().trim().optional().nullable(),
  assignedPersonId: z.coerce.number().int().positive().optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional()
});

export const reorderTasksSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.coerce.number().int().positive(),
      status: taskStatusSchema,
      sortOrder: z.coerce.number().int().nonnegative()
    })
  )
});
