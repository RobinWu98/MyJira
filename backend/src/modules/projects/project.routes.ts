import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject
} from "./project.service.js";
import {
  createProjectSchema,
  projectIdParamsSchema,
  updateProjectSchema
} from "./project.schemas.js";

export const projectRouter = Router();

projectRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listProjects());
  } catch (error) {
    next(error);
  }
});

projectRouter.post("/", async (req, res, next) => {
  try {
    const input = createProjectSchema.parse(req.body);
    res.status(201).json(await createProject(input));
  } catch (error) {
    next(error);
  }
});

projectRouter.get("/:projectId", async (req, res, next) => {
  try {
    const { projectId } = projectIdParamsSchema.parse(req.params);
    res.json(await getProject(projectId));
  } catch (error) {
    next(error);
  }
});

projectRouter.patch("/:projectId", async (req, res, next) => {
  try {
    const { projectId } = projectIdParamsSchema.parse(req.params);
    const input = updateProjectSchema.parse(req.body);
    res.json(await updateProject(projectId, input));
  } catch (error) {
    next(error);
  }
});

projectRouter.delete("/:projectId", async (req, res, next) => {
  try {
    const { projectId } = projectIdParamsSchema.parse(req.params);
    await deleteProject(projectId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
