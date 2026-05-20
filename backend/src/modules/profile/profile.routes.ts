import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../middleware/auth.js";
import { BadRequestError } from "../../middleware/error-handler.js";
import { toPersonResponse } from "../../utils/person-response.js";
import { changePasswordSchema, updateProfileSchema } from "./profile.schemas.js";

export const profileRouter = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", async (req, res, next) => {
  try {
    const person = await prisma.person.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: { department: true }
    });

    res.json(toPersonResponse(person));
  } catch (error) {
    next(error);
  }
});

profileRouter.patch("/", async (req, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const person = await prisma.person.update({
      where: { id: req.user!.id },
      data: {
        name: input.name,
        contactNumber: input.contactNumber
      },
      include: { department: true }
    });

    res.json(toPersonResponse(person));
  } catch (error) {
    next(error);
  }
});

profileRouter.patch("/password", async (req, res, next) => {
  try {
    const input = changePasswordSchema.parse(req.body);
    const person = await prisma.person.findUniqueOrThrow({ where: { id: req.user!.id } });
    const isValid = await bcrypt.compare(input.currentPassword, person.passwordHash);

    if (!isValid) {
      throw new BadRequestError("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await prisma.person.update({
      where: { id: person.id },
      data: { passwordHash }
    });

    res.json({ message: "Password updated" });
  } catch (error) {
    next(error);
  }
});
