import { Router } from "express";
import {
  createTask,
  deleteTask,
  listTasks,
  reorderTasks,
  updateTask
} from "./task.service.js";
import {
  createTaskSchema,
  projectTaskParamsSchema,
  reorderTasksSchema,
  taskIdParamsSchema,
  updateTaskSchema
} from "./task.schemas.js";

export const taskRouter = Router();
export const projectTaskRouter = Router({ mergeParams: true });

projectTaskRouter.get("/", async (req, res, next) => {
  try {
    const { projectId } = projectTaskParamsSchema.parse(req.params);
    res.json(await listTasks(projectId));
  } catch (error) {
    next(error);
  }
});

projectTaskRouter.post("/", async (req, res, next) => {
  try {
    const { projectId } = projectTaskParamsSchema.parse(req.params);
    const input = createTaskSchema.parse(req.body);
    res.status(201).json(await createTask(projectId, input));
  } catch (error) {
    next(error);
  }
});

projectTaskRouter.patch("/reorder", async (req, res, next) => {
  try {
    const { projectId } = projectTaskParamsSchema.parse(req.params);
    const input = reorderTasksSchema.parse(req.body);
    res.json(await reorderTasks(projectId, input));
  } catch (error) {
    next(error);
  }
});

taskRouter.patch("/:taskId", async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    const input = updateTaskSchema.parse(req.body);
    res.json(await updateTask(taskId, input));
  } catch (error) {
    next(error);
  }
});

taskRouter.delete("/:taskId", async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    await deleteTask(taskId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
