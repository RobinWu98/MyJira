import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { peopleRouter } from "./modules/people/people.routes.js";
import { projectRouter } from "./modules/projects/project.routes.js";
import { projectTaskRouter, taskRouter } from "./modules/tasks/task.routes.js";

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/people", peopleRouter);
app.use("/api/projects", projectRouter);
app.use("/api/projects/:projectId/tasks", projectTaskRouter);
app.use("/api/tasks", taskRouter);

app.use(errorHandler);
