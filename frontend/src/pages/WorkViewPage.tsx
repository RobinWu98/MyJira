import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, Bell, BellRing, Filter, FolderKanban, Pencil, Plus, RotateCcw, Search, UserCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDepartments } from "../api/departments";
import { fetchPeople } from "../api/people";
import { createTask, fetchTask, fetchTaskReport, updateTask, type TaskReportQuery } from "../api/tasks";
import { useAuth } from "../auth/AuthContext";
import { TaskActivityModal } from "../components/tasks/TaskActivityModal";
import { TaskForm } from "../components/tasks/TaskForm";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { GroupBy, Person, ReportTask, TaskPriority, TaskReport, TaskStatus } from "../types";
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
  groupBy: "person" as GroupBy | "",
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
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState("");
  const [openPopover, setOpenPopover] = useState<PopoverName>(null);
  const [showNotificationsOnly, setShowNotificationsOnly] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

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

  const selectedTaskQuery = useQuery({
    queryKey: ["tasks", selectedTaskId],
    queryFn: () => fetchTask(selectedTaskId!),
    enabled: selectedTaskId !== null
  });

  const editingTaskQuery = useQuery({
    queryKey: ["tasks", editingTaskId],
    queryFn: () => fetchTask(editingTaskId!),
    enabled: editingTaskId !== null
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-report"] });
      setIsTaskFormOpen(false);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateTask>[1] }) =>
      updateTask(id, payload),
    onSuccess: (_task, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["task-report"] });
      setEditingTaskId(null);
    }
  });

  const departments = departmentsQuery.data ?? [];
  const people = peopleQuery.data ?? [];
  const report = reportQuery.data;
  const visibleReport = useMemo(
    () => filterReportByNotifications(filterReportBySearch(report, search), showNotificationsOnly),
    [report, search, showNotificationsOnly]
  );
  const unreadNotificationTotal = useMemo(() => countUnreadNotifications(report), [report]);
  const shouldPrioritizeCurrentUser = isDefaultPersonView(filters, search, showNotificationsOnly);
  const visiblePersonGroups = useMemo(
    () => buildPersonGroups(visibleReport, people, auth.user, shouldPrioritizeCurrentUser, shouldPrioritizeCurrentUser),
    [visibleReport, people, auth.user, shouldPrioritizeCurrentUser]
  );
  const reportTasks = useMemo(() => flattenReportTasks(report), [report]);
  const editingReportTask = reportTasks.find((task) => task.id === editingTaskId);
  const canEditEditingTaskStatus =
    Boolean(auth.user) &&
    (auth.user?.id === editingTaskQuery.data?.assignedPersonId ||
      auth.user?.id === editingReportTask?.createdByPersonId);

  const chips = buildActiveChips(filters, departments, people);
  const totalTasks = visibleReport
    ? visibleReport.groupBy
      ? visibleReport.groups.reduce((sum, group) => sum + group.tasks.length, 0)
      : visibleReport.tasks.length
    : 0;

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-center justify-end gap-4">
          <Link className="inline-flex items-center gap-2 text-sm text-slate-600" to="/profile">
            <UserCircle size={16} />
            Profile
          </Link>
        </div>

        <header className="mb-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-normal">Company tasks</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {totalTasks}
              </span>
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center justify-start gap-2">
            <Button onClick={() => setIsTaskFormOpen(true)}>
              <Plus size={16} />
              Create Task
            </Button>
            <label className="relative block w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                className="focus-ring h-9 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm"
                placeholder="Search tasks..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <ToolbarButton
              active={showNotificationsOnly}
              onClick={() => setShowNotificationsOnly((current) => !current)}
            >
              {showNotificationsOnly ? <BellRing size={16} /> : <Bell size={16} />}
              Notifications
              {unreadNotificationTotal ? (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                  {unreadNotificationTotal}
                </span>
              ) : null}
            </ToolbarButton>
            <div className="relative">
              <ToolbarButton
                active={openPopover === "filter"}
                onClick={() => setOpenPopover((current) => (current === "filter" ? null : "filter"))}
              >
                <Filter size={16} />
                Filter
              </ToolbarButton>
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
            </div>
            <div className="relative">
              <ToolbarButton
                active={openPopover === "sort"}
                onClick={() => setOpenPopover((current) => (current === "sort" ? null : "sort"))}
              >
                <ArrowDownUp size={16} />
                Sort
              </ToolbarButton>
              {openPopover === "sort" ? (
                <Popover title="Sort" onClose={() => setOpenPopover(null)}>
                  <SortContent filters={filters} onChange={setFilters} />
                </Popover>
              ) : null}
            </div>
            <div className="relative">
              <ToolbarButton
                active={openPopover === "group"}
                onClick={() => setOpenPopover((current) => (current === "group" ? null : "group"))}
              >
                <FolderKanban size={16} />
                Group by
              </ToolbarButton>
              {openPopover === "group" ? (
                <Popover title="Group by" onClose={() => setOpenPopover(null)}>
                  <GroupContent filters={filters} onChange={setFilters} />
                </Popover>
              ) : null}
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setFilters(defaultFilters);
                setSearch("");
                setShowNotificationsOnly(false);
                setOpenPopover(null);
              }}
            >
              <RotateCcw size={16} />
              Reset
            </Button>

          </div>
        </header>

        {chips.length ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {showNotificationsOnly ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
                Notifications only
              </span>
            ) : null}
            {search ? (
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs text-slate-600">
                Search: {search}
              </span>
            ) : null}
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : search || showNotificationsOnly ? (
          <div className="mb-4 flex flex-wrap gap-2">
            {showNotificationsOnly ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800">
                Notifications only
              </span>
            ) : null}
            {search ? (
              <span className="rounded-full border border-line bg-white px-3 py-1 text-xs text-slate-600">
                Search: {search}
              </span>
            ) : null}
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
        ) : visibleReport?.groupBy ? (
          <div className="space-y-5">
            {(visibleReport.groupBy === "person" ? visiblePersonGroups : visibleReport.groups).map((group) => (
              <section
                key={`${group.groupId ?? "none"}-${group.groupName}`}
                className="rounded-lg border border-line bg-white"
              >
                <div className="border-b border-line px-4 py-3">
                  <h2 className="font-semibold">{group.groupName}</h2>
                  <p className="text-sm text-slate-500">{group.tasks.length} tasks</p>
                </div>
                <TaskTable
                  tasks={group.tasks}
                  compactGroup={visibleReport.groupBy}
                  currentUser={auth.user}
                  emptyTaskLabel={visibleReport.groupBy === "person" ? "No tasks assigned" : "No matching tasks"}
                  onEditTask={setEditingTaskId}
                  onOpenTask={setSelectedTaskId}
                />
              </section>
            ))}
            {!visibleReport.groups.length ? (
              <section className="rounded-lg border border-line bg-white">
                <TaskTable
                  tasks={[]}
                  currentUser={auth.user}
                  emptyTaskLabel="No matching tasks"
                  onEditTask={setEditingTaskId}
                  onOpenTask={setSelectedTaskId}
                />
              </section>
            ) : null}
          </div>
        ) : (
          <section className="rounded-lg border border-line bg-white">
            <TaskTable
              tasks={visibleReport?.tasks ?? []}
              currentUser={auth.user}
              emptyTaskLabel="No matching tasks"
              onEditTask={setEditingTaskId}
              onOpenTask={setSelectedTaskId}
            />
          </section>
        )}
      </div>

      {selectedTaskId !== null ? (
        <Modal title="Task activity" onClose={() => setSelectedTaskId(null)}>
          {selectedTaskQuery.isLoading ? (
            <div className="rounded-lg border border-line p-4 text-center text-sm text-slate-500">
              Loading task...
            </div>
          ) : selectedTaskQuery.isError || !selectedTaskQuery.data ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              Could not load this task.
            </div>
          ) : (
            <TaskActivityModal people={people} task={selectedTaskQuery.data} />
          )}
        </Modal>
      ) : null}

      {isTaskFormOpen ? (
        <Modal title="Create task" onClose={() => setIsTaskFormOpen(false)}>
          <TaskForm
            people={people}
            departments={departments}
            isSubmitting={createTaskMutation.isPending}
            onSubmit={(payload) => createTaskMutation.mutate(payload)}
          />
        </Modal>
      ) : null}

      {editingTaskId !== null ? (
        <Modal title="Edit task" onClose={() => setEditingTaskId(null)}>
          {editingTaskQuery.isLoading ? (
            <div className="rounded-lg border border-line p-4 text-center text-sm text-slate-500">
              Loading task...
            </div>
          ) : editingTaskQuery.isError || !editingTaskQuery.data ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              Could not load this task.
            </div>
          ) : (
            <TaskForm
              people={people}
              departments={departments}
              task={editingTaskQuery.data}
              canEditStatus={canEditEditingTaskStatus}
              isSubmitting={updateTaskMutation.isPending}
              onSubmit={(payload) =>
                updateTaskMutation.mutate({
                  id: editingTaskQuery.data.id,
                  payload: { ...payload, version: editingTaskQuery.data.version }
                })
              }
            />
          )}
        </Modal>
      ) : null}
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

function canEditReportTask(task: ReportTask, user: Person | null) {
  if (!user) {
    return false;
  }

  if (user.role === "ADMIN" || user.role === "MANAGER") {
    return true;
  }

  return user.id === task.assignedPersonId || user.id === task.createdByPersonId;
}

function flattenReportTasks(report: TaskReport | undefined) {
  if (!report) {
    return [];
  }

  if (report.groupBy) {
    return report.groups.flatMap((group) => group.tasks);
  }

  return report.tasks;
}

function isDefaultPersonView(filters: typeof defaultFilters, search: string, showNotificationsOnly: boolean) {
  return (
    filters.groupBy === "person" &&
    !search.trim() &&
    !showNotificationsOnly &&
    !filters.priority &&
    !filters.status &&
    !filters.statusNot &&
    !filters.departmentId &&
    !filters.assignedPersonId &&
    !filters.startDateFrom &&
    !filters.startDateTo &&
    filters.incompleteForMoreThanDays === ""
  );
}

function buildPersonGroups(
  report: TaskReport | undefined,
  people: Person[],
  currentUser: Person | null,
  prioritizeCurrentUser: boolean,
  includeEmptyPeople: boolean
) {
  if (!report || report.groupBy !== "person") {
    return [];
  }

  const groupByPersonId = new Map(
    report.groups.map((group) => [group.groupId, group])
  );
  const orderedPeople =
    prioritizeCurrentUser && currentUser
      ? [
          ...people.filter((person) => person.id === currentUser.id),
          ...people.filter((person) => person.id !== currentUser.id)
        ]
      : people;
  const groups: { groupId: number | null; groupName: string; tasks: ReportTask[] }[] = orderedPeople.map((person) => ({
    groupId: person.id,
    groupName: person.id === currentUser?.id ? `${person.name} (me)` : person.name,
    tasks: groupByPersonId.get(person.id)?.tasks ?? []
  })).filter((group) => includeEmptyPeople || group.tasks.length > 0);
  const unassignedGroup = groupByPersonId.get(null);

  if (unassignedGroup?.tasks.length) {
    groups.push(unassignedGroup);
  }

  return groups;
}

function countUnreadNotifications(report: TaskReport | undefined) {
  return flattenReportTasks(report).reduce(
    (sum, task) => sum + task.unreadNotificationCount,
    0
  );
}

function TaskTable({
  tasks,
  compactGroup,
  currentUser,
  emptyTaskLabel = "No matching tasks",
  onEditTask,
  onOpenTask
}: {
  tasks: ReportTask[];
  compactGroup?: GroupBy;
  currentUser: Person | null;
  emptyTaskLabel?: string;
  onEditTask: (taskId: number) => void;
  onOpenTask: (taskId: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] table-fixed border-collapse text-center text-sm">
        <colgroup>
          <col className="w-[24%]" />
          {compactGroup !== "department" ? <col className="w-[18%]" /> : null}
          {compactGroup !== "person" ? <col className="w-[18%]" /> : null}
          <col className="w-[13%]" />
          <col className="w-[13%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3 pl-14 text-left font-semibold">Task</th>
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
          {tasks.length ? tasks.map((task) => (
            <tr key={task.id} className="h-16">
              <td className="px-4 py-3 text-left font-medium">
                <div className="flex min-w-0 items-center justify-start gap-2">
                  {canEditReportTask(task, currentUser) ? (
                    <button
                      aria-label={`Edit ${task.title}`}
                      className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-white text-slate-600 transition hover:bg-slate-50"
                      onClick={() => onEditTask(task.id)}
                      title="Edit task"
                      type="button"
                    >
                      <Pencil size={15} />
                    </button>
                  ) : (
                    <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0" />
                  )}
                  <button
                    className="focus-ring block min-w-0 truncate rounded-sm text-center text-brand hover:underline"
                    onClick={() => onOpenTask(task.id)}
                    title={task.title}
                    type="button"
                  >
                    {task.title}
                  </button>
                  {task.unreadNotificationCount > 0 ? (
                    <span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                      title="You were mentioned in this task"
                    >
                      <Bell size={14} />
                      {task.unreadNotificationCount}
                    </span>
                  ) : null}
                </div>
              </td>
              {compactGroup !== "department" ? (
                <td className="truncate px-4 py-3 text-slate-600" title={task.departmentName}>
                  {task.departmentName}
                </td>
              ) : null}
              {compactGroup !== "person" ? (
                <td className="truncate px-4 py-3 text-slate-600" title={task.assignedPersonName}>
                  {task.assignedPersonName}
                </td>
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
              <td className="px-4 py-3">
                <span
                  className={
                    task.status === "DONE"
                      ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700"
                      : "text-slate-600"
                  }
                >
                  {task.durationDays} days
                </span>
              </td>
            </tr>
          )) : (
            <tr className="h-16">
              <td className="px-4 py-3 text-left font-medium text-slate-500">
                {emptyTaskLabel}
              </td>
              {compactGroup !== "department" ? (
                <td className="px-4 py-3 text-slate-500">-</td>
              ) : null}
              {compactGroup !== "person" ? (
                <td className="px-4 py-3 text-slate-500">-</td>
              ) : null}
              <td className="px-4 py-3 text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">-</td>
              <td className="px-4 py-3 text-slate-500">-</td>
            </tr>
          )}
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
    const groupLabel = filters.groupBy === "department" ? "Department" : "Person";
    chips.push(`Group: ${groupLabel}`);
  }

  return chips;
}

function filterReportBySearch(report: TaskReport | undefined, search: string) {
  if (!report) {
    return report;
  }

  const query = search.trim().toLowerCase();

  if (!query) {
    return report;
  }

  const matches = (task: ReportTask) =>
    [
      task.title,
      task.departmentName,
      task.assignedPersonName,
      priorityLabels[task.priority],
      statusLabels[task.status]
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

  if (report.groupBy) {
    return {
      ...report,
      groups: report.groups
        .map((group) => ({
          ...group,
          tasks: group.tasks.filter(matches)
        }))
        .filter((group) => group.tasks.length > 0)
    };
  }

  return {
    ...report,
    tasks: report.tasks.filter(matches)
  };
}

function filterReportByNotifications(report: TaskReport | undefined, enabled: boolean) {
  if (!report || !enabled) {
    return report;
  }

  const hasNotification = (task: ReportTask) => task.unreadNotificationCount > 0;

  if (report.groupBy) {
    return {
      ...report,
      groups: report.groups
        .map((group) => ({
          ...group,
          tasks: group.tasks.filter(hasNotification)
        }))
        .filter((group) => group.tasks.length > 0)
    };
  }

  return {
    ...report,
    tasks: report.tasks.filter(hasNotification)
  };
}
