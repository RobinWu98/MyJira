import type { z } from "zod";
import { BadRequestError, NotFoundError } from "../../middleware/error-handler.js";
import { prisma } from "../../db/prisma.js";
import type { createTaskSchema, reorderTasksSchema, updateTaskSchema } from "./task.schemas.js";

const taskInclude = {
  assignedPerson: true
};

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

  const lastTask = await prisma.task.findFirst({
    where: { projectId, status: input.status },
    orderBy: { sortOrder: "desc" }
  });

  return prisma.task.create({
    data: {
      projectId,
      title: input.title,
      description: input.description,
      assignedPersonId: input.assignedPersonId,
      status: input.status,
      priority: input.priority,
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

  return prisma.task.update({
    where: { id: taskId },
    data: input,
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
          sortOrder: task.sortOrder
        }
      })
    )
  );

  return listTasks(projectId);
}
