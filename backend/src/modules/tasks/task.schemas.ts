import { z } from "zod";

export const taskIdParamsSchema = z.object({
  taskId: z.coerce.number().int().positive()
});

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "DONE"]);
export const taskPrioritySchema = z.enum(["HIGH", "NORMAL", "LOW"]);

function maxWords(limit: number, fieldName: string) {
  return (value: string | null | undefined, ctx: z.RefinementCtx) => {
    if (!value) {
      return;
    }

    const wordCount = value.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount > limit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${fieldName} must be ${limit} words or fewer`
      });
    }
  };
}

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").superRefine(maxWords(50, "Task title")),
  description: z.string().trim().optional().nullable().superRefine(maxWords(500, "Description")),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  assignedPersonId: z.coerce.number().int().positive().optional().nullable(),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("NORMAL"),
  startDate: z.coerce.date().optional().nullable()
});

export const updateTaskSchema = z.object({
  version: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, "Task title is required").superRefine(maxWords(50, "Task title")).optional(),
  description: z.string().trim().optional().nullable().superRefine(maxWords(500, "Description")),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  assignedPersonId: z.coerce.number().int().positive().optional().nullable(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
  startDate: z.coerce.date().optional().nullable()
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

export const createTaskNoteSchema = z.object({
  message: z.string().trim().min(1, "Note is required").max(2000, "Note is too long")
});
