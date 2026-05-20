import { Prisma, type TaskPriority, type TaskStatus } from "@prisma/client";
import type { z } from "zod";
import { BadRequestError, NotFoundError } from "../../middleware/error-handler.js";
import { prisma } from "../../db/prisma.js";
import type {
  createTaskSchema,
  reorderTasksSchema,
  taskReportQuerySchema,
  updateTaskSchema
} from "./task.schemas.js";

const taskInclude = {
  department: true,
  assignedPerson: true,
  project: true
};

const priorityRank: Record<TaskPriority, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
};

type ReportQuery = z.infer<typeof taskReportQuerySchema>;

async function ensureProjectExists(projectId: number) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) {
    throw new NotFoundError("Project not found");
  }
}

async function ensureAssignedPersonExists(personId?: number | null) {
  if (!personId) {
    return;
  }

  const person = await prisma.person.findUnique({ where: { id: personId } });

  if (!person) {
    throw new BadRequestError("Assigned person does not exist");
  }
}

async function ensureDepartmentExists(departmentId?: number | null) {
  if (!departmentId) {
    return;
  }

  const department = await prisma.department.findUnique({ where: { id: departmentId } });

  if (!department) {
    throw new BadRequestError("Department does not exist");
  }
}

export async function listTasks(projectId: number) {
  await ensureProjectExists(projectId);

  return prisma.task.findMany({
    where: { projectId },
    include: taskInclude,
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }]
  });
}

export async function createTask(projectId: number, input: z.infer<typeof createTaskSchema>) {
  await ensureProjectExists(projectId);
  await ensureAssignedPersonExists(input.assignedPersonId);
  await ensureDepartmentExists(input.departmentId);

  const lastTask = await prisma.task.findFirst({
    where: { projectId, status: input.status },
    orderBy: { sortOrder: "desc" }
  });

  return prisma.task.create({
    data: {
      projectId,
      departmentId: input.departmentId,
      title: input.title,
      description: input.description,
      assignedPersonId: input.assignedPersonId,
      status: input.status,
      priority: input.priority,
      startDate: input.startDate,
      completedAt: input.status === "DONE" ? new Date() : null,
      sortOrder: (lastTask?.sortOrder ?? -1) + 1
    },
    include: taskInclude
  });
}

export async function updateTask(taskId: number, input: z.infer<typeof updateTaskSchema>) {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing) {
    throw new NotFoundError("Task not found");
  }

  await ensureAssignedPersonExists(input.assignedPersonId);
  await ensureDepartmentExists(input.departmentId);

  const completedAt =
    input.status === "DONE" && existing.status !== "DONE"
      ? new Date()
      : input.status && input.status !== "DONE"
        ? null
        : undefined;

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...input,
      completedAt
    },
    include: taskInclude
  });
}

export async function deleteTask(taskId: number) {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing) {
    throw new NotFoundError("Task not found");
  }

  await prisma.task.delete({ where: { id: taskId } });
}

export async function reorderTasks(projectId: number, input: z.infer<typeof reorderTasksSchema>) {
  await ensureProjectExists(projectId);

  const taskIds = input.tasks.map((task) => task.id);
  const existingTasks = await prisma.task.findMany({
    where: { id: { in: taskIds }, projectId },
    select: { id: true }
  });

  if (existingTasks.length !== taskIds.length) {
    throw new BadRequestError("Every reordered task must belong to the project");
  }

  await prisma.$transaction(
    input.tasks.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: {
          status: task.status,
          sortOrder: task.sortOrder,
          completedAt: task.status === "DONE" ? new Date() : null
        }
      })
    )
  );

  return listTasks(projectId);
}

function addEndOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function getIncompleteDurationDays(task: { status: TaskStatus; startDate: Date | null; createdAt: Date }) {
  if (task.status === "DONE") {
    return null;
  }

  const start = task.startDate ?? task.createdAt;
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
}

type ReportTask = {
  id: number;
  title: string;
  projectId: number;
  projectName: string;
  departmentId: number | null;
  departmentName: string;
  assignedPersonId: number | null;
  assignedPersonName: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  incompleteDurationDays: number | null;
};

async function listReportTasks(query: ReportQuery): Promise<ReportTask[]> {
  const where: Prisma.TaskWhereInput = {};

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.statusNot) {
    where.status = { not: query.statusNot };
  }

  if (query.assignedPersonId) {
    where.assignedPersonId = query.assignedPersonId;
  }

  if (query.startDateFrom || query.startDateTo) {
    where.startDate = {
      ...(query.startDateFrom ? { gte: query.startDateFrom } : {}),
      ...(query.startDateTo ? { lte: addEndOfDay(query.startDateTo) } : {})
    };
  }

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude
  });

  return tasks
    .map((task) => ({
      id: task.id,
      title: task.title,
      projectId: task.projectId,
      projectName: task.project.name,
      departmentId: task.department?.id ?? null,
      departmentName: task.department?.name ?? "No department",
      assignedPersonId: task.assignedPerson?.id ?? null,
      assignedPersonName: task.assignedPerson?.name ?? "Unassigned",
      priority: task.priority,
      status: task.status,
      startDate: task.startDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      incompleteDurationDays: getIncompleteDurationDays(task)
    }))
    .filter((task) => {
      if (query.incompleteForMoreThanDays === undefined) {
        return true;
      }

      return (
        task.incompleteDurationDays !== null &&
        task.incompleteDurationDays > query.incompleteForMoreThanDays
      );
    });
}

function compareDate(a: Date | null, b: Date | null, direction: "asc" | "desc") {
  const aTime = a?.getTime() ?? 0;
  const bTime = b?.getTime() ?? 0;
  return direction === "asc" ? aTime - bTime : bTime - aTime;
}

function compareNumber(a: number | null, b: number | null, direction: "asc" | "desc") {
  const aValue = a ?? -1;
  const bValue = b ?? -1;
  return direction === "asc" ? aValue - bValue : bValue - aValue;
}

function sortReportTasks(tasks: ReportTask[], sort?: string) {
  const sortRules =
    sort
      ?.split(",")
      .map((rule) => rule.trim())
      .filter(Boolean)
      .slice(0, 2) ?? [];

  const rules = sortRules.length ? sortRules : ["priority_desc", "startDate_asc"];

  return [...tasks].sort((a, b) => {
    for (const rule of rules) {
      let result = 0;

      if (rule === "priority_desc") {
        result = priorityRank[b.priority] - priorityRank[a.priority];
      } else if (rule === "priority_asc") {
        result = priorityRank[a.priority] - priorityRank[b.priority];
      } else if (rule === "startDate_asc") {
        result = compareDate(a.startDate ?? a.createdAt, b.startDate ?? b.createdAt, "asc");
      } else if (rule === "startDate_desc") {
        result = compareDate(a.startDate ?? a.createdAt, b.startDate ?? b.createdAt, "desc");
      } else if (rule === "duration_desc") {
        result = compareNumber(a.incompleteDurationDays, b.incompleteDurationDays, "desc");
      } else if (rule === "duration_asc") {
        result = compareNumber(a.incompleteDurationDays, b.incompleteDurationDays, "asc");
      } else if (rule === "updatedAt_desc") {
        result = compareDate(a.updatedAt, b.updatedAt, "desc");
      }

      if (result !== 0) {
        return result;
      }
    }

    return a.title.localeCompare(b.title);
  });
}

export async function getTaskReport(query: ReportQuery) {
  const tasks = sortReportTasks(await listReportTasks(query), query.sort);

  if (!query.groupBy) {
    return {
      groupBy: null,
      tasks
    };
  }

  const groupMap = new Map<string, { groupId: number | null; groupName: string; tasks: ReportTask[] }>();

  for (const task of tasks) {
    const groupId = query.groupBy === "department" ? task.departmentId : task.assignedPersonId;
    const groupName = query.groupBy === "department" ? task.departmentName : task.assignedPersonName;
    const key = `${groupId ?? "none"}:${groupName}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, { groupId, groupName, tasks: [] });
    }

    groupMap.get(key)?.tasks.push(task);
  }

  return {
    groupBy: query.groupBy,
    groups: [...groupMap.values()]
  };
}
