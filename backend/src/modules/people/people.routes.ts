import { Router } from "express";
import { prisma } from "../../db/prisma.js";
import { toPersonResponse } from "../../utils/person-response.js";

export const peopleRouter = Router();

peopleRouter.get("/", async (_req, res, next) => {
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
