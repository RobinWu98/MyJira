import { apiRequest } from "./client";
import type { GroupBy, Task, TaskLog, TaskNotification, TaskPriority, TaskReport, TaskStatus } from "../types";

export type TaskPayload = {
  title: string;
  description?: string | null;
  departmentId?: number | null;
  assignedPersonId?: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
};

export type UpdateTaskPayload = Partial<TaskPayload> & {
  version: number;
};

export function fetchTask(taskId: number) {
  return apiRequest<Task>(`/tasks/${taskId}`);
}

export function createTask(payload: TaskPayload) {
  return apiRequest<Task>("/tasks", {
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

export function fetchTaskNotifications(taskId: number) {
  return apiRequest<TaskNotification[]>(`/tasks/${taskId}/notifications`);
}

export function markTaskNotificationsRead(taskId: number) {
  return apiRequest<void>(`/tasks/${taskId}/notifications/read`, {
    method: "PATCH"
  });
}
