import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { BadRequestError } from "../../middleware/error-handler.js";
import { toPersonResponse } from "../../utils/person-response.js";
import {
  createPersonSchema,
  personIdParamsSchema,
  resetPersonPasswordSchema,
  updatePersonSchema
} from "./people.schemas.js";

export const adminPeopleRouter = Router();

adminPeopleRouter.use(requireAuth, requireRole(["ADMIN"]));

async function ensureDepartmentExists(departmentId?: number | null) {
  if (!departmentId) {
    return;
  }

  const department = await prisma.department.findUnique({ where: { id: departmentId } });

  if (!department) {
    throw new BadRequestError("Department does not exist");
  }
}

adminPeopleRouter.get("/", async (_req, res, next) => {
  try {
    const people = await prisma.person.findMany({
      include: { department: true },
      orderBy: { name: "asc" }
    });

    res.json(people.map(toPersonResponse));
  } catch (error) {
    next(error);
  }
});

adminPeopleRouter.post("/", async (req, res, next) => {
  try {
    const input = createPersonSchema.parse(req.body);
    await ensureDepartmentExists(input.departmentId);
    const passwordHash = await bcrypt.hash(input.password, 10);

    const person = await prisma.person.create({
      data: {
        name: input.name,
        email: input.email,
        contactNumber: input.contactNumber,
        departmentId: input.departmentId,
        role: input.role,
        passwordHash
      },
      include: { department: true }
    });

    res.status(201).json(toPersonResponse(person));
  } catch (error) {
    next(error);
  }
});

adminPeopleRouter.patch("/:personId", async (req, res, next) => {
  try {
    const { personId } = personIdParamsSchema.parse(req.params);
    const input = updatePersonSchema.parse(req.body);
    await ensureDepartmentExists(input.departmentId);

    const person = await prisma.person.update({
      where: { id: personId },
      data: {
        name: input.name,
        email: input.email,
        contactNumber: input.contactNumber,
        departmentId: input.departmentId,
        role: input.role
      },
      include: { department: true }
    });

    res.json(toPersonResponse(person));
  } catch (error) {
    next(error);
  }
});

adminPeopleRouter.delete("/:personId", async (req, res, next) => {
  try {
    const { personId } = personIdParamsSchema.parse(req.params);

    if (personId === req.user!.id) {
      throw new BadRequestError("You cannot delete your own account");
    }

    await prisma.person.delete({ where: { id: personId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

adminPeopleRouter.patch("/:personId/password", async (req, res, next) => {
  try {
    const { personId } = personIdParamsSchema.parse(req.params);
    const input = resetPersonPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(input.password, 10);

    await prisma.person.update({
      where: { id: personId },
      data: { passwordHash }
    });

    res.json({ message: "Password reset" });
  } catch (error) {
    next(error);
  }
});
