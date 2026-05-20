import type { TaskPriority, TaskStatus } from "../types";

export const statusLabels: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done"
};

export const priorityLabels: Record<TaskPriority, string> = {
  HIGH: "High",
  NORMAL: "Normal",
  LOW: "Low"
};

export const statuses: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];
export const priorities: TaskPriority[] = ["HIGH", "NORMAL", "LOW"];

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}
