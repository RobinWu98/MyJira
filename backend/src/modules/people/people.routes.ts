import { Router } from "express";
import { prisma } from "../../db/prisma.js";

export const peopleRouter = Router();

peopleRouter.get("/", async (_req, res, next) => {
  try {
    const people = await prisma.person.findMany({
      include: { department: true },
      orderBy: { name: "asc" }
    });

    res.json(people);
  } catch (error) {
    next(error);
  }
});
