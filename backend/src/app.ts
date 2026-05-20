import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { adminPeopleRouter } from "./modules/admin/people.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { departmentRouter } from "./modules/departments/department.routes.js";
import { peopleRouter } from "./modules/people/people.routes.js";
import { profileRouter } from "./modules/profile/profile.routes.js";
import { projectRouter } from "./modules/projects/project.routes.js";
import { projectTaskRouter, taskRouter } from "./modules/tasks/task.routes.js";

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/people", peopleRouter);
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/admin/people", adminPeopleRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/projects", projectRouter);
app.use("/api/projects/:projectId/tasks", projectTaskRouter);
app.use("/api/tasks", taskRouter);

app.use(errorHandler);
