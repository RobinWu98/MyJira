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
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  assignedPersonId: z.coerce.number().int().positive().optional().nullable(),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("NORMAL"),
  startDate: z.coerce.date().optional().nullable()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").optional(),
  description: z.string().trim().optional().nullable(),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  assignedPersonId: z.coerce.number().int().positive().optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
  startDate: z.coerce.date().optional().nullable()
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

export const taskReportQuerySchema = z.object({
  groupBy: z.enum(["department", "person"]).optional(),
  priority: taskPrioritySchema.optional(),
  status: taskStatusSchema.optional(),
  statusNot: taskStatusSchema.optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  assignedPersonId: z.coerce.number().int().positive().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  incompleteForMoreThanDays: z.coerce.number().int().nonnegative().optional(),
  sort: z.string().trim().optional()
});
