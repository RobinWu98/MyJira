import { apiRequest } from "./client";
import type { Task, TaskPriority, TaskStatus } from "../types";

export type TaskPayload = {
  title: string;
  description?: string | null;
  assignedPersonId?: number | null;
  status: TaskStatus;
  priority: TaskPriority;
};

export type ReorderTaskPayload = {
  id: number;
  status: TaskStatus;
  sortOrder: number;
};

export function fetchTasks(projectId: number) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks`);
}

export function createTask(projectId: number, payload: TaskPayload) {
  return apiRequest<Task>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTask(taskId: number, payload: Partial<TaskPayload>) {
  return apiRequest<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function deleteTask(taskId: number) {
  return apiRequest<void>(`/tasks/${taskId}`, {
    method: "DELETE"
  });
}

export function reorderTasks(projectId: number, tasks: ReorderTaskPayload[]) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ tasks })
  });
}
