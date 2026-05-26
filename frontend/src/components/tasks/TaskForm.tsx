import { useState } from "react";
import type { Department, Person, Task, TaskPriority, TaskStatus } from "../../types";
import { formatDateInput, priorities, priorityLabels, statuses, statusLabels } from "../../utils/labels";
import { Button } from "../ui/Button";

const TITLE_WORD_LIMIT = 50;
const DESCRIPTION_WORD_LIMIT = 500;

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
  const titleWordCount = countWords(title);
  const descriptionWordCount = countWords(description);
  const isOverLimit =
    titleWordCount > TITLE_WORD_LIMIT || descriptionWordCount > DESCRIPTION_WORD_LIMIT;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title: limitWords(title, TITLE_WORD_LIMIT),
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
          onChange={(event) => setTitle(limitWords(event.target.value, TITLE_WORD_LIMIT))}
          required
        />
        <span className="mt-1 block text-xs text-slate-500">
          {titleWordCount}/{TITLE_WORD_LIMIT} words
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Description</span>
        <textarea
          className="focus-ring mt-1 min-h-24 w-full rounded-md border border-line px-3 py-2"
          value={description}
          onChange={(event) => setDescription(limitWords(event.target.value, DESCRIPTION_WORD_LIMIT))}
        />
        <span className="mt-1 block text-xs text-slate-500">
          {descriptionWordCount}/{DESCRIPTION_WORD_LIMIT} words
        </span>
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
        <Button type="submit" disabled={isSubmitting || isOverLimit}>
          {task ? "Save Task" : "Create Task"}
        </Button>
      </div>
    </form>
  );
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function limitWords(value: string, limit: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);

  if (words.length <= limit) {
    return value;
  }

  return words.slice(0, limit).join(" ");
}
