import { apiRequest } from "./client";
import type { ProjectDetail, ProjectSummary } from "../types";

export type ProjectPayload = {
  name: string;
  description?: string | null;
  createdByPersonId: number;
};

export function fetchProjects() {
  return apiRequest<ProjectSummary[]>("/projects");
}

export function fetchProject(projectId: number) {
  return apiRequest<ProjectDetail>(`/projects/${projectId}`);
}

export function createProject(payload: ProjectPayload) {
  return apiRequest<ProjectSummary>("/projects", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateProject(projectId: number, payload: Partial<ProjectPayload>) {
  return apiRequest<ProjectSummary>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteProject(projectId: number) {
  return apiRequest<void>(`/projects/${projectId}`, {
    method: "DELETE"
  });
}
