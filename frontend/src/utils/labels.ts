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

export const statusBadgeClasses: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700 border-slate-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  DONE: "bg-green-50 text-green-700 border-green-200"
};

export const priorityBadgeClasses: Record<TaskPriority, string> = {
  HIGH: "bg-red-50 text-red-700 border-red-200",
  NORMAL: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200"
};

export const projectStatusBadgeClasses: Record<"Empty" | "In Progress" | "Done", string> = {
  Empty: "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
  Done: "bg-green-50 text-green-700 border-green-200"
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

export function formatDateInput(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}
