import { useState } from "react";
import type { Department, Person, Task, TaskPriority, TaskStatus } from "../../types";
import { formatDateInput, priorities, priorityLabels, statuses, statusLabels } from "../../utils/labels";
import { Button } from "../ui/Button";

type TaskFormProps = {
  people: Person[];
  departments: Department[];
  task?: Task;
  canEditStatus?: boolean;
  onSubmit: (payload: {
    title: string;
    description: string | null;
    departmentId: number | null;
    assignedPersonId: number | null;
    status: TaskStatus;
    priority: TaskPriority;
    startDate: string | null;
  }) => void;
  isSubmitting: boolean;
};

export function TaskForm({
  people,
  departments,
  task,
  canEditStatus = true,
  onSubmit,
  isSubmitting
}: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [departmentId, setDepartmentId] = useState(task?.departmentId ?? 0);
  const [assignedPersonId, setAssignedPersonId] = useState(task?.assignedPersonId ?? 0);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "NORMAL");
  const [startDate, setStartDate] = useState(formatDateInput(task?.startDate));

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title,
          description: description.trim() || null,
          departmentId: departmentId || null,
          assignedPersonId: assignedPersonId || null,
          status,
          priority,
          startDate: startDate || null
        });
      }}
    >
      <label className="block">
        <span className="text-sm font-medium">Task title</span>
        <input
          className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          className="focus-ring mt-1 min-h-24 w-full rounded-md border border-line px-3 py-2"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Department</span>
          <select
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
            value={departmentId}
            onChange={(event) => setDepartmentId(Number(event.target.value))}
          >
            <option value={0}>No department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Assigned person</span>
          <select
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
            value={assignedPersonId}
            onChange={(event) => setAssignedPersonId(Number(event.target.value))}
          >
            <option value={0}>Unassigned</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Status</span>
          <select
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
            disabled={task ? canEditStatus === false : false}
            value={status}
            onChange={(event) => setStatus(event.target.value as TaskStatus)}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Priority</span>
          <select
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
          >
            {priorities.map((value) => (
              <option key={value} value={value}>
                {priorityLabels[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">Start date</span>
          <input
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {task ? "Save Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
