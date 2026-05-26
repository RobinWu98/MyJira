import { Router } from "express";
import {
  createTaskNote,
  createTask,
  deleteTask,
  getTask,
  getTaskReport,
  listTaskLogs,
  listTasks,
  reorderTasks,
  updateTask
} from "./task.service.js";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import {
  createTaskNoteSchema,
  createTaskSchema,
  projectTaskParamsSchema,
  reorderTasksSchema,
  taskReportQuerySchema,
  taskIdParamsSchema,
  updateTaskSchema
} from "./task.schemas.js";

export const taskRouter = Router();
export const projectTaskRouter = Router({ mergeParams: true });

taskRouter.get("/report", async (req, res, next) => {
  try {
    const query = taskReportQuerySchema.parse(req.query);
    res.json(await getTaskReport(query));
  } catch (error) {
    next(error);
  }
});

projectTaskRouter.get("/", async (req, res, next) => {
  try {
    const { projectId } = projectTaskParamsSchema.parse(req.params);
    res.json(await listTasks(projectId));
  } catch (error) {
    next(error);
  }
});

projectTaskRouter.post("/", optionalAuth, async (req, res, next) => {
  try {
    const { projectId } = projectTaskParamsSchema.parse(req.params);
    const input = createTaskSchema.parse(req.body);
    res.status(201).json(await createTask(projectId, input, req.user?.id));
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
