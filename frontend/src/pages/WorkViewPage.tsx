import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, ArrowLeft, Filter, FolderKanban, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDepartments } from "../api/departments";
import { fetchPeople } from "../api/people";
import { fetchTaskReport, type TaskReportQuery } from "../api/tasks";
import { Button } from "../components/ui/Button";
import type { GroupBy, ReportTask, TaskPriority, TaskStatus } from "../types";
import {
  formatDate,
  priorities,
  priorityBadgeClasses,
  priorityLabels,
  statusBadgeClasses,
  statuses,
  statusLabels
} from "../utils/labels";

type PopoverName = "filter" | "sort" | "group" | null;

const sortOptions = [
  { value: "priority_desc", label: "Priority high to low" },
  { value: "priority_asc", label: "Priority low to high" },
  { value: "startDate_asc", label: "Start date oldest first" },
  { value: "startDate_desc", label: "Start date newest first" },
  { value: "duration_desc", label: "Longest incomplete duration first" },
  { value: "duration_asc", label: "Shortest incomplete duration first" },
  { value: "updatedAt_desc", label: "Last updated newest first" }
];

const defaultFilters = {
  groupBy: "" as GroupBy | "",
  priority: "" as TaskPriority | "",
  status: "" as TaskStatus | "",
  statusNot: "" as TaskStatus | "",
  departmentId: "" as number | "",
  assignedPersonId: "" as number | "",
  startDateFrom: "",
  startDateTo: "",
  incompleteForMoreThanDays: "" as number | "",
  sort1: "priority_desc",
  sort2: "startDate_asc"
};

export function WorkViewPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [openPopover, setOpenPopover] = useState<PopoverName>(null);

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  const peopleQuery = useQuery({
    queryKey: ["people"],
    queryFn: fetchPeople
  });

  const reportQueryPayload: TaskReportQuery = useMemo(
    () => ({
      groupBy: filters.groupBy,
      priority: filters.priority,
      status: filters.status,
      statusNot: filters.status ? "" : filters.statusNot,
      departmentId: filters.departmentId,
      assignedPersonId: filters.assignedPersonId,
      startDateFrom: filters.startDateFrom,
      startDateTo: filters.startDateTo,
      incompleteForMoreThanDays: filters.incompleteForMoreThanDays,
      sort: [filters.sort1, filters.sort2].filter(Boolean).join(",")
    }),
    [filters]
  );

  const reportQuery = useQuery({
    queryKey: ["task-report", reportQueryPayload],
    queryFn: () => fetchTaskReport(reportQueryPayload)
  });

  const departments = departmentsQuery.data ?? [];
  const people = peopleQuery.data ?? [];
  const report = reportQuery.data;

  const chips = buildActiveChips(filters, departments, people);
  const totalTasks = report
    ? report.groupBy
      ? report.groups.reduce((sum, group) => sum + group.tasks.length, 0)
      : report.tasks.length
    : 0;

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2 text-sm text-slate-600" to="/">
            <ArrowLeft size={16} />
            Back to projects
          </Link>
        </div>

        <header className="mb-4 flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-normal">Company tasks</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {totalTasks}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Filter, sort, and optionally group task work across projects.
            </p>
          </div>

          <div className="relative flex flex-wrap items-center justify-start gap-2 lg:justify-end">
            <ToolbarButton
              active={openPopover === "filter"}
              onClick={() => setOpenPopover((current) => (current === "filter" ? null : "filter"))}
            >
              <Filter size={16} />
              Filter
            </ToolbarButton>
            <ToolbarButton
              active={openPopover === "sort"}
              onClick={() => setOpenPopover((current) => (current === "sort" ? null : "sort"))}
            >
              <ArrowDownUp size={16} />
              Sort
            </ToolbarButton>
            <ToolbarButton
              active={openPopover === "group"}
              onClick={() => setOpenPopover((current) => (current === "group" ? null : "group"))}
            >
              <FolderKanban size={16} />
              Group by
            </ToolbarButton>
            <Button
              variant="ghost"
              onClick={() => {
                setFilters(defaultFilters);
                setOpenPopover(null);
              }}
            >
              <RotateCcw size={16} />
              Reset
            </Button>

            {openPopover === "filter" ? (
              <Popover title="Filter" onClose={() => setOpenPopover(null)}>
                <FilterContent
                  filters={filters}
                  departments={departments}
                  people={people}
                  onChange={setFilters}
                />
              </Popover>
            ) : null}

            {openPopover === "sort" ? (
              <Popover title="Sort" onClose={() => setOpenPopover(null)}>
                <SortContent filters={filters} onChange={setFilters} />
              </Popover>
            ) : null}

            {openPopover === "group" ? (
              <Popover title="Group by" onClose={() => setOpenPopover(null)}>
                <GroupContent filters={filters} onChange={setFilters} />
              </Popover>
            ) : null}
          </div>
        </header>

        {chips.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {reportQuery.isLoading ? (
          <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">
            Loading tasks...
          </div>
        ) : reportQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Could not load task report.
          </div>
        ) : report?.groupBy ? (
          <div className="space-y-5">
            {report.groups.map((group) => (
              <section
                key={`${group.groupId ?? "none"}-${group.groupName}`}
                className="rounded-lg border border-line bg-white"
              >
                <div className="border-b border-line px-4 py-3">
                  <h2 className="font-semibold">{group.groupName}</h2>
                  <p className="text-sm text-slate-500">{group.tasks.length} tasks</p>
                </div>
                <TaskTable tasks={group.tasks} compactGroup={report.groupBy} />
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-lg border border-line bg-white">
            <TaskTable tasks={report?.tasks ?? []} />
          </section>
        )}
      </div>
    </main>
  );
}

function ToolbarButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      className={`focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Popover({
  title,
  children,
  onClose
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-11 z-30 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-line bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button className="text-sm text-slate-500 hover:text-slate-900" onClick={onClose} type="button">
          Done
        </button>
      </div>
      {children}
    </div>
  );
}

function FilterContent({
  filters,
  departments,
  people,
  onChange
}: {
  filters: typeof defaultFilters;
  departments: { id: number; name: string }[];
  people: { id: number; name: string }[];
  onChange: React.Dispatch<React.SetStateAction<typeof defaultFilters>>;
}) {
  return (
    <div className="space-y-3">
      <Select
        label="Priority"
        value={filters.priority}
        onChange={(value) => onChange((current) => ({ ...current, priority: value as TaskPriority | "" }))}
      >
        <option value="">Any priority</option>
        {priorities.map((priority) => (
          <option key={priority} value={priority}>
            {priorityLabels[priority]}
          </option>
        ))}
      </Select>

      <Select
        label="Status"
        value={filters.status || (filters.statusNot === "DONE" ? "NOT_DONE" : "")}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            status: value && value !== "NOT_DONE" ? (value as TaskStatus) : "",
            statusNot: value === "NOT_DONE" ? "DONE" : ""
          }))
        }
      >
        <option value="">All tasks</option>
        <option value="NOT_DONE">Not Done</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </Select>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Department"
          value={filters.departmentId}
          onChange={(value) =>
            onChange((current) => ({ ...current, departmentId: value ? Number(value) : "" }))
          }
        >
          <option value="">Any department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>

        <Select
          label="Person"
          value={filters.assignedPersonId}
          onChange={(value) =>
            onChange((current) => ({ ...current, assignedPersonId: value ? Number(value) : "" }))
          }
        >
          <option value="">Any person</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Started from"
          type="date"
          value={filters.startDateFrom}
          onChange={(value) => onChange((current) => ({ ...current, startDateFrom: value }))}
        />
        <Input
          label="Started to"
          type="date"
          value={filters.startDateTo}
          onChange={(value) => onChange((current) => ({ ...current, startDateTo: value }))}
        />
      </div>

      <Select
        label="Incomplete duration"
        value={filters.incompleteForMoreThanDays}
        onChange={(value) =>
          onChange((current) => ({
            ...current,
            incompleteForMoreThanDays: value ? Number(value) : ""
          }))
        }
      >
        <option value="">Any duration</option>
        <option value={3}>More than 3 days</option>
        <option value={7}>More than 7 days</option>
        <option value={14}>More than 14 days</option>
        <option value={30}>More than 30 days</option>
      </Select>
    </div>
  );
}

function SortContent({
  filters,
  onChange
}: {
  filters: typeof defaultFilters;
  onChange: React.Dispatch<React.SetStateAction<typeof defaultFilters>>;
}) {
  return (
    <div className="space-y-3">
      <Select
        label="Primary sort"
        value={filters.sort1}
        onChange={(value) => onChange((current) => ({ ...current, sort1: value }))}
      >
        <option value="">No primary sort</option>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        label="Secondary sort"
        value={filters.sort2}
        onChange={(value) => onChange((current) => ({ ...current, sort2: value }))}
      >
        <option value="">No secondary sort</option>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

function GroupContent({
  filters,
  onChange
}: {
  filters: typeof defaultFilters;
  onChange: React.Dispatch<React.SetStateAction<typeof defaultFilters>>;
}) {
  return (
    <div className="space-y-2">
      {[
        { value: "", label: "No group", description: "Show one flat task list." },
        { value: "department", label: "Department", description: "Group tasks by task department." },
        { value: "person", label: "Person", description: "Group tasks by assigned person." }
      ].map((option) => (
        <button
          key={option.label}
          className={`focus-ring w-full rounded-md border px-3 py-2 text-left transition ${
            filters.groupBy === option.value
              ? "border-slate-900 bg-slate-50"
              : "border-line bg-white hover:bg-slate-50"
          }`}
          onClick={() =>
            onChange((current) => ({ ...current, groupBy: option.value as GroupBy | "" }))
          }
          type="button"
        >
          <span className="block text-sm font-medium">{option.label}</span>
          <span className="block text-xs text-slate-500">{option.description}</span>
        </button>
      ))}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase text-slate-500">{label}</span>
      <select
        className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </label>
  );
}

function Input({
  label,
  value,
  type,
  onChange
}: {
  label: string;
  value: string;
  type: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase text-slate-500">{label}</span>
      <input
        className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TaskTable({ tasks, compactGroup }: { tasks: ReportTask[]; compactGroup?: GroupBy }) {
  if (!tasks.length) {
    return <div className="p-6 text-sm text-slate-500">No matching tasks.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-center text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Task</th>
            <th className="px-4 py-3 font-semibold">Project</th>
            {compactGroup !== "department" ? (
              <th className="px-4 py-3 font-semibold">Department</th>
            ) : null}
            {compactGroup !== "person" ? <th className="px-4 py-3 font-semibold">Person</th> : null}
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Start date</th>
            <th className="px-4 py-3 font-semibold">Open duration</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-4 py-3 text-center font-medium">{task.title}</td>
              <td className="px-4 py-3 text-slate-600">{task.projectName}</td>
              {compactGroup !== "department" ? (
                <td className="px-4 py-3 text-slate-600">{task.departmentName}</td>
              ) : null}
              {compactGroup !== "person" ? (
                <td className="px-4 py-3 text-slate-600">{task.assignedPersonName}</td>
              ) : null}
              <td className="px-4 py-3 text-center">
                <span className={`rounded-full border px-2 py-1 text-xs font-medium ${priorityBadgeClasses[task.priority]}`}>
                  {priorityLabels[task.priority]}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClasses[task.status]}`}>
                  {statusLabels[task.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {task.startDate ? formatDate(task.startDate) : "No start date"}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {task.incompleteDurationDays === null
                  ? "Complete"
                  : `${task.incompleteDurationDays} days`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function buildActiveChips(
  filters: typeof defaultFilters,
  departments: { id: number; name: string }[],
  people: { id: number; name: string }[]
) {
  const chips: string[] = [];

  if (filters.status) {
    chips.push(`Status: ${statusLabels[filters.status]}`);
  } else if (filters.statusNot === "DONE") {
    chips.push("Status: Not Done");
  }

  if (filters.priority) {
    chips.push(`Priority: ${priorityLabels[filters.priority]}`);
  }

  if (filters.departmentId) {
    chips.push(`Department: ${departments.find((department) => department.id === filters.departmentId)?.name ?? filters.departmentId}`);
  }

  if (filters.assignedPersonId) {
    chips.push(`Person: ${people.find((person) => person.id === filters.assignedPersonId)?.name ?? filters.assignedPersonId}`);
  }

  if (filters.startDateFrom) {
    chips.push(`Started from: ${filters.startDateFrom}`);
  }

  if (filters.startDateTo) {
    chips.push(`Started to: ${filters.startDateTo}`);
  }

  if (filters.incompleteForMoreThanDays !== "") {
    chips.push(`Open > ${filters.incompleteForMoreThanDays} days`);
  }

  if (filters.sort1 || filters.sort2) {
    const sortLabels = [filters.sort1, filters.sort2]
      .filter(Boolean)
      .map((value) => sortOptions.find((option) => option.value === value)?.label ?? value);
    chips.push(`Sort: ${sortLabels.join(", ")}`);
  }

  if (filters.groupBy) {
    chips.push(`Group: ${filters.groupBy === "department" ? "Department" : "Person"}`);
  }

  return chips;
}
