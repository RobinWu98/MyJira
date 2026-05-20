import { Prisma } from "@prisma/client";
import { BadRequestError, NotFoundError } from "../../middleware/error-handler.js";
import { prisma } from "../../db/prisma.js";
import type { createProjectSchema, updateProjectSchema } from "./project.schemas.js";
import type { z } from "zod";

const projectListInclude = {
  createdBy: true,
  tasks: {
    select: {
      id: true,
      status: true,
      completedAt: true,
      updatedAt: true
    }
  },
  _count: {
    select: { tasks: true }
  }
} satisfies Prisma.ProjectInclude;

const projectDetailInclude = {
  createdBy: true,
  tasks: {
    include: { assignedPerson: true, department: true },
    orderBy: [{ status: "asc" }, { sortOrder: "asc" }]
  }
} satisfies Prisma.ProjectInclude;

async function ensurePersonExists(personId: number) {
  const person = await prisma.person.findUnique({ where: { id: personId } });

  if (!person) {
    throw new BadRequestError("Creator person does not exist");
  }
}

export async function listProjects() {
  return prisma.project.findMany({
    include: projectListInclude,
    orderBy: { updatedAt: "desc" }
  });
}

export async function getProject(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: projectDetailInclude
  });

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  return project;
}

export async function createProject(input: z.infer<typeof createProjectSchema>) {
  await ensurePersonExists(input.createdByPersonId);

  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      startDate: input.startDate,
      createdByPersonId: input.createdByPersonId
    },
    include: projectListInclude
  });
}

export async function updateProject(projectId: number, input: z.infer<typeof updateProjectSchema>) {
  await getProject(projectId);

  if (input.createdByPersonId) {
    await ensurePersonExists(input.createdByPersonId);
  }

  return prisma.project.update({
    where: { id: projectId },
    data: input,
    include: projectListInclude
  });
}

export async function deleteProject(projectId: number) {
  await getProject(projectId);
  await prisma.project.delete({ where: { id: projectId } });
}
