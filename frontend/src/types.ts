export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "HIGH" | "NORMAL" | "LOW";
export type GroupBy = "department" | "person";
export type UserRole = "ADMIN" | "MANAGER" | "USER";
export type TaskLogType = "TASK_CREATED" | "ASSIGNEE_CHANGED" | "PRIORITY_CHANGED" | "STATUS_CHANGED" | "NOTE";

export type Department = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Person = {
  id: number;
  departmentId: number | null;
  name: string;
  email: string;
  contactNumber: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  department?: Department | null;
};

export type Task = {
  id: number;
  createdByPersonId: number | null;
  departmentId: number | null;
  title: string;
  description: string | null;
  assignedPersonId: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  sortOrder: number;
  startDate: string | null;
  completedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: Person | null;
  department: Department | null;
  assignedPerson: Person | null;
};

export type ReportTask = {
  id: number;
  createdByPersonId: number | null;
  unreadNotificationCount: number;
  title: string;
  departmentId: number | null;
  departmentName: string;
  assignedPersonId: number | null;
  assignedPersonName: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string | null;
  durationDays: number;
  createdAt: string;
  updatedAt: string;
  incompleteDurationDays: number | null;
};

export type TaskReport =
  | {
      groupBy: null;
      tasks: ReportTask[];
    }
  | {
      groupBy: GroupBy;
      groups: {
        groupId: number | null;
        groupName: string;
        tasks: ReportTask[];
      }[];
    };

export type TaskLog = {
  id: number;
  taskId: number;
  actorId: number | null;
  type: TaskLogType;
  message: string;
  metadata: unknown;
  createdAt: string;
  actor: Person | null;
};

export type TaskNotification = {
  id: number;
  taskId: number;
  recipientId: number;
  actorId: number | null;
  taskLogId: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
};

export type UserNotification = {
  id: number;
  recipientId: number;
  senderId: number | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  sender?: {
    id: number;
    name: string;
    email: string;
  } | null;
};
