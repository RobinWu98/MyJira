export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
export type TaskPriority = "HIGH" | "NORMAL" | "LOW";

export type Person = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSummary = {
  id: number;
  name: string;
  description: string | null;
  createdByPersonId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: Person;
  _count: {
    tasks: number;
  };
};

export type Task = {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  assignedPersonId: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  assignedPerson: Person | null;
};

export type ProjectDetail = {
  id: number;
  name: string;
  description: string | null;
  createdByPersonId: number;
  createdAt: string;
  updatedAt: string;
  createdBy: Person;
  tasks: Task[];
};
