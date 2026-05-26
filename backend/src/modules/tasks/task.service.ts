import { Prisma, type TaskPriority, type TaskStatus, type UserRole } from "@prisma/client";
import type { z } from "zod";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../middleware/error-handler.js";
import { prisma } from "../../db/prisma.js";
import type {
  createTaskNoteSchema,
  createTaskSchema,
  taskReportQuerySchema,
  updateTaskSchema
} from "./task.schemas.js";

const taskInclude = {
  department: true,
  assignedPerson: true,
  createdBy: true
};

const priorityRank: Record<TaskPriority, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
};

type ReportQuery = z.infer<typeof taskReportQuerySchema>;

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

export async function listTasks() {
  return prisma.task.findMany({
    include: taskInclude,
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }]
  });
}

export async function getTask(taskId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: taskInclude
  });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  return task;
}

function formatPersonName(name?: string | null) {
  return name ?? "Unassigned";
}

function formatActorName(name?: string | null) {
  return name ?? "Someone";
}

function formatPriorityLabel(priority: TaskPriority) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

async function getActorName(actorId?: number) {
  if (!actorId) {
    return null;
  }

  const actor = await prisma.person.findUnique({
    where: { id: actorId },
    select: { name: true }
  });

  return actor?.name ?? null;
}

async function getTaskCreatorId(taskId: number) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { createdByPersonId: true }
  });

  if (task?.createdByPersonId) {
    return task.createdByPersonId;
  }

  const createdLog = await prisma.taskLog.findFirst({
    where: { taskId, type: "TASK_CREATED" },
    orderBy: { createdAt: "asc" },
    select: { actorId: true }
  });

  return createdLog?.actorId ?? null;
}

async function createAssignmentNotification(
  tx: Prisma.TransactionClient,
  taskId: number,
  assignedPersonId: number | null | undefined,
  actorId: number | null | undefined,
  actorName: string | null
) {
  if (!assignedPersonId || assignedPersonId === actorId) {
    return;
  }

  await tx.taskNotification.create({
    data: {
      taskId,
      recipientId: assignedPersonId,
      actorId,
      message: `${formatActorName(actorName)} assigned this task to you.`
    }
  });
}

function normalizeMentionName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function findMentionedPeople(message: string, actorId: number) {
  const people = await prisma.person.findMany({
    select: { id: true, name: true }
  });
  const normalizedMessage = normalizeMentionName(message);
  const mentioned = new Map<number, { id: number; name: string }>();

  for (const person of people) {
    if (person.id === actorId) {
      continue;
    }

    if (normalizedMessage.includes(`@${normalizeMentionName(person.name)}`)) {
      mentioned.set(person.id, person);
    }
  }

  return [...mentioned.values()];
}

export async function createTask(
  input: z.infer<typeof createTaskSchema>,
  actorId: number
) {
  await ensureAssignedPersonExists(input.assignedPersonId);
  await ensureDepartmentExists(input.departmentId);

  const lastTask = await prisma.task.findFirst({
    where: { status: input.status },
    orderBy: { sortOrder: "desc" }
  });

  const actorName = await getActorName(actorId);

  return prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        createdByPersonId: actorId,
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

    await tx.taskLog.create({
      data: {
        taskId: task.id,
        actorId,
        type: "TASK_CREATED",
        message: `${formatActorName(actorName)} created this task.`
      }
    });

    await createAssignmentNotification(
      tx,
      task.id,
      input.assignedPersonId,
      actorId,
      actorName
    );

    return task;
  });
}

export async function updateTask(
  taskId: number,
  input: z.infer<typeof updateTaskSchema>,
  actor?: { id: number; role: UserRole }
) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignedPerson: true }
  });

  if (!existing) {
    throw new NotFoundError("Task not found");
  }

  const creatorId = await getTaskCreatorId(taskId);
  const canEditTask =
    Boolean(actor) &&
    (actor?.role === "ADMIN" ||
      actor?.role === "MANAGER" ||
      actor?.id === existing.assignedPersonId ||
      actor?.id === creatorId);

  if (!canEditTask) {
    throw new ForbiddenError("Only admins, managers, the task creator, or assigned person can edit this task");
  }

  if (input.status && input.status !== existing.status) {
    const canChangeStatus =
      Boolean(actor) &&
      (actor?.id === existing.assignedPersonId || actor?.id === creatorId);

    if (!canChangeStatus) {
      throw new ForbiddenError("Only the task creator or assigned person can change task status");
    }
  }

  await ensureAssignedPersonExists(input.assignedPersonId);
  await ensureDepartmentExists(input.departmentId);

  const completedAt =
    input.status === "DONE" && existing.status !== "DONE"
      ? new Date()
      : input.status && input.status !== "DONE"
        ? null
        : undefined;

  const nextAssignee =
    input.assignedPersonId !== undefined && input.assignedPersonId !== null
      ? await prisma.person.findUnique({ where: { id: input.assignedPersonId } })
      : null;
  const actorName = await getActorName(actor?.id);
  const { version, ...taskInput } = input;

  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.task.updateMany({
      where: { id: taskId, version },
      data: {
        ...taskInput,
        completedAt,
        version: { increment: 1 }
      }
    });

    if (updateResult.count === 0) {
      throw new ConflictError("This task was changed by someone else. Please refresh and try again.");
    }

    if (
      taskInput.assignedPersonId !== undefined &&
      taskInput.assignedPersonId !== existing.assignedPersonId
    ) {
      const fromName = formatPersonName(existing.assignedPerson?.name);
      const toName = formatPersonName(nextAssignee?.name);

      await tx.taskLog.create({
        data: {
          taskId,
          actorId: actor?.id,
          type: "ASSIGNEE_CHANGED",
          message: `${formatActorName(actorName)} changed assignee from ${fromName} to ${toName}.`,
          metadata: {
            fromPersonId: existing.assignedPersonId,
            toPersonId: taskInput.assignedPersonId
          }
        }
      });

      await createAssignmentNotification(
        tx,
        taskId,
        taskInput.assignedPersonId,
        actor?.id,
        actorName
      );
    }

    if (taskInput.priority && taskInput.priority !== existing.priority) {
      await tx.taskLog.create({
        data: {
          taskId,
          actorId: actor?.id,
          type: "PRIORITY_CHANGED",
          message: `${formatActorName(actorName)} changed priority from ${formatPriorityLabel(existing.priority)} to ${formatPriorityLabel(taskInput.priority)}.`,
          metadata: {
            fromPriority: existing.priority,
            toPriority: taskInput.priority
          }
        }
      });
    }

    const task = await tx.task.findUnique({
      where: { id: taskId },
      include: taskInclude
    });

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    return task;
  });
}

export async function deleteTask(taskId: number) {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing) {
    throw new NotFoundError("Task not found");
  }

  await prisma.task.delete({ where: { id: taskId } });
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
  createdByPersonId: number | null;
  unreadNotificationCount: number;
  title: string;
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

async function listReportTasks(query: ReportQuery, viewerId?: number): Promise<ReportTask[]> {
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
  const unreadCounts = viewerId
    ? await prisma.taskNotification.groupBy({
        by: ["taskId"],
        where: {
          recipientId: viewerId,
          isRead: false,
          taskId: { in: tasks.map((task) => task.id) }
        },
        _count: { _all: true }
      })
    : [];
  const unreadCountByTaskId = new Map(
    unreadCounts.map((count) => [count.taskId, count._count._all])
  );

  return tasks
    .map((task) => ({
      id: task.id,
      createdByPersonId: task.createdByPersonId,
      unreadNotificationCount: unreadCountByTaskId.get(task.id) ?? 0,
      title: task.title,
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

export async function getTaskReport(query: ReportQuery, viewerId?: number) {
  const tasks = sortReportTasks(await listReportTasks(query, viewerId), query.sort);

  if (!query.groupBy) {
    return {
      groupBy: null,
      tasks
    };
  }

  const groupMap = new Map<string, { groupId: number | null; groupName: string; tasks: ReportTask[] }>();

  for (const task of tasks) {
    const groupId =
      query.groupBy === "department"
        ? task.departmentId
        : task.assignedPersonId;
    const groupName =
      query.groupBy === "department"
        ? task.departmentName
        : task.assignedPersonName;
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

export async function listTaskLogs(taskId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  return prisma.taskLog.findMany({
    where: { taskId },
    include: { actor: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function markTaskNotificationsRead(taskId: number, personId: number) {
  await prisma.taskNotification.updateMany({
    where: {
      taskId,
      recipientId: personId,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  });
}

export async function createTaskNote(
  taskId: number,
  input: z.infer<typeof createTaskNoteSchema>,
  actorId: number
) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  const actorName = await getActorName(actorId);
  const mentionedPeople = await findMentionedPeople(input.message, actorId);

  return prisma.$transaction(async (tx) => {
    const log = await tx.taskLog.create({
      data: {
        taskId,
        actorId,
        type: "NOTE",
        message: input.message,
        metadata: {
          actorName: formatActorName(actorName),
          mentionedPersonIds: mentionedPeople.map((person) => person.id)
        }
      },
      include: { actor: true }
    });

    if (mentionedPeople.length) {
      await tx.taskNotification.createMany({
        data: mentionedPeople.map((person) => ({
          taskId,
          recipientId: person.id,
          actorId,
          taskLogId: log.id,
          message: `${formatActorName(actorName)} mentioned you in this task.`
        }))
      });
    }

    return log;
  });
}

export async function listTaskNotifications(taskId: number, personId: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  return prisma.taskNotification.findMany({
    where: {
      taskId,
      recipientId: personId,
      isRead: false
    },
    orderBy: { createdAt: "desc" }
  });
}
