import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../db/prisma.js";
import { UnauthorizedError } from "../../middleware/error-handler.js";
import { requireAuth, signAuthToken } from "../../middleware/auth.js";
import { toPersonResponse } from "../../utils/person-response.js";
import { loginSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const person = await prisma.person.findUnique({
      where: { email: input.email },
      include: { department: true }
    });

    if (!person) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, person.passwordHash);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const user = toPersonResponse(person);
    const token = signAuthToken({
      id: person.id,
      email: person.email,
      role: person.role
    });

    res.json({ token, user });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
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

authRouter.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});
