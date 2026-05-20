import { Router } from "express";
import { prisma } from "../../db/prisma.js";

export const departmentRouter = Router();

departmentRouter.get("/", async (_req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" }
    });

    res.json(departments);
  } catch (error) {
    next(error);
  }
});
