import { Router } from "express";
import {
  createTaskNote,
  createTask,
  deleteTask,
  getTask,
  getTaskReport,
  listTaskLogs,
  listTaskNotifications,
  listTasks,
  markTaskNotificationsRead,
  updateTask
} from "./task.service.js";
import { requireAuth } from "../../middleware/auth.js";
import {
  createTaskNoteSchema,
  createTaskSchema,
  taskReportQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema
} from "./task.schemas.js";

export const taskRouter = Router();

taskRouter.get("/report", requireAuth, async (req, res, next) => {
  try {
    const query = taskReportQuerySchema.parse(req.query);
    res.json(await getTaskReport(query, req.user!.id));
  } catch (error) {
    next(error);
  }
});

taskRouter.get("/", requireAuth, async (_req, res, next) => {
  try {
    res.json(await listTasks());
  } catch (error) {
    next(error);
  }
});

taskRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const input = createTaskSchema.parse(req.body);
    res.status(201).json(await createTask(input, req.user!.id));
  } catch (error) {
    next(error);
  }
});

taskRouter.get("/:taskId", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    res.json(await getTask(taskId));
  } catch (error) {
    next(error);
  }
});

taskRouter.get("/:taskId/logs", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    res.json(await listTaskLogs(taskId));
  } catch (error) {
    next(error);
  }
});

taskRouter.get("/:taskId/notifications", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    res.json(await listTaskNotifications(taskId, req.user!.id));
  } catch (error) {
    next(error);
  }
});

taskRouter.patch("/:taskId/notifications/read", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    await markTaskNotificationsRead(taskId, req.user!.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

taskRouter.post("/:taskId/logs", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    const input = createTaskNoteSchema.parse(req.body);
    res.status(201).json(await createTaskNote(taskId, input, req.user!.id));
  } catch (error) {
    next(error);
  }
});

taskRouter.patch("/:taskId", requireAuth, async (req, res, next) => {
  try {
    const { taskId } = taskIdParamsSchema.parse(req.params);
    const input = updateTaskSchema.parse(req.body);
    res.json(await updateTask(taskId, input, req.user!));
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
