import { apiRequest } from "./client";
import type { GroupBy, Task, TaskLog, TaskPriority, TaskReport, TaskStatus } from "../types";

export type TaskPayload = {
  title: string;
  description?: string | null;
  departmentId?: number | null;
  assignedPersonId?: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
};

export type ReorderTaskPayload = {
  id: number;
  status: TaskStatus;
  sortOrder: number;
  version: number;
};

export type UpdateTaskPayload = Partial<TaskPayload> & {
  version: number;
};

export function fetchTasks(projectId: number) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks`);
}

export function fetchTask(taskId: number) {
  return apiRequest<Task>(`/tasks/${taskId}`);
}

export function createTask(projectId: number, payload: TaskPayload) {
  return apiRequest<Task>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTask(taskId: number, payload: UpdateTaskPayload) {
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

export type TaskReportQuery = {
  groupBy?: GroupBy | "";
  priority?: TaskPriority | "";
  status?: TaskStatus | "";
  statusNot?: TaskStatus | "";
  departmentId?: number | "";
  assignedPersonId?: number | "";
  startDateFrom?: string;
  startDateTo?: string;
  incompleteForMoreThanDays?: number | "";
  sort?: string;
};

export function fetchTaskReport(query: TaskReportQuery) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const search = params.toString();
  return apiRequest<TaskReport>(`/tasks/report${search ? `?${search}` : ""}`);
}

export function fetchTaskLogs(taskId: number) {
  return apiRequest<TaskLog[]>(`/tasks/${taskId}/logs`);
}

export function createTaskNote(taskId: number, message: string) {
  return apiRequest<TaskLog>(`/tasks/${taskId}/logs`, {
    method: "POST",
    body: JSON.stringify({ message })
  });
}
