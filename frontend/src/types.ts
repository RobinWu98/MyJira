export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "HIGH" | "NORMAL" | "LOW";
export type GroupBy = "department" | "person";

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
  createdAt: string;
  updatedAt: string;
  department?: Department | null;
};

export type ProjectSummary = {
  id: number;
  name: string;
  description: string | null;
  createdByPersonId: number;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: Person;
  tasks: {
    id: number;
    status: TaskStatus;
    completedAt: string | null;
    updatedAt: string;
  }[];
  _count: {
    tasks: number;
  };
};

export type Task = {
  id: number;
  projectId: number;
  departmentId: number | null;
  title: string;
  description: string | null;
  assignedPersonId: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  sortOrder: number;
  startDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  department: Department | null;
  assignedPerson: Person | null;
};

export type ProjectDetail = {
  id: number;
  name: string;
  description: string | null;
  createdByPersonId: number;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: Person;
  tasks: Task[];
};

export type ReportTask = {
  id: number;
  title: string;
  projectId: number;
  projectName: string;
  departmentId: number | null;
  departmentName: string;
  assignedPersonId: number | null;
  assignedPersonName: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string | null;
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
