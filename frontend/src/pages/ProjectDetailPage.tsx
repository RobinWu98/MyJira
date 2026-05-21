import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownUp, ArrowLeft, Edit, Filter, FolderKanban, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchDepartments } from "../api/departments";
import { fetchPeople } from "../api/people";
import { deleteProject, fetchProject, updateProject } from "../api/projects";
import { createTask, deleteTask, reorderTasks, updateTask } from "../api/tasks";
import { ApiError } from "../api/client";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { ProjectForm } from "../components/projects/ProjectForm";
import { TaskActivityModal } from "../components/tasks/TaskActivityModal";
import { TaskForm } from "../components/tasks/TaskForm";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import type { GroupBy, Task, TaskPriority, TaskStatus } from "../types";
import {
  formatDate,
  priorities,
  priorityLabels,
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

const defaultControls = {
  search: "",
  groupBy: "" as GroupBy | "",
  priority: "" as TaskPriority | "",
  status: "" as TaskStatus | "",
  statusNot: "" as TaskStatus | "",
  departmentId: "" as number | "",
  assignedPersonId: "" as number | "",
  startDateFrom: "",
  startDateTo: "",
  incompleteForMoreThanDays: "" as number | "",
  sort1: "",
  sort2: ""
};

const priorityRank: Record<TaskPriority, number> = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
};

export function ProjectDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = Number(params.projectId);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activityTask, setActivityTask] = useState<Task | null>(null);
  const [editTaskConflictMessage, setEditTaskConflictMessage] = useState("");
  const [reorderConflictMessage, setReorderConflictMessage] = useState("");
  const [controls, setControls] = useState(defaultControls);
  const [openPopover, setOpenPopover] = useState<PopoverName>(null);

  const projectQuery = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: Number.isFinite(projectId)
  });

  const peopleQuery = useQuery({
    queryKey: ["people"],
    queryFn: fetchPeople
  });

  const departmentsQuery = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments
  });

  const updateProjectMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateProject>[1]) => updateProject(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      setIsProjectFormOpen(false);
    }
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/");
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createTask>[1]) => createTask(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      setIsTaskFormOpen(false);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateTask>[1] }) =>
      updateTask(id, payload),
    onMutate: () => {
      setEditTaskConflictMessage("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      setEditingTask(null);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setEditTaskConflictMessage(error.message);
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      }
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: (tasks: Parameters<typeof reorderTasks>[1]) => reorderTasks(projectId, tasks),
    onMutate: () => {
      setReorderConflictMessage("");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setReorderConflictMessage(error.message);
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      }
    }
  });

  const project = projectQuery.data;
  const people = peopleQuery.data ?? [];
  const departments = departmentsQuery.data ?? [];
  const visibleTasks = useMemo(
    () => buildVisibleTasks(project?.tasks ?? [], controls),
    [project?.tasks, controls]
  );
  const groupedTasks = useMemo(
    () => groupTasks(visibleTasks, controls.groupBy),
    [visibleTasks, controls.groupBy]
  );
  const activeChips = buildActiveChips(controls, departments, people);
  const hasViewControls = Boolean(
    controls.search ||
      controls.groupBy ||
      controls.priority ||
      controls.status ||
      controls.statusNot ||
      controls.departmentId ||
      controls.assignedPersonId ||
      controls.startDateFrom ||
      controls.startDateTo ||
      controls.incompleteForMoreThanDays !== "" ||
      controls.sort1 ||
      controls.sort2
  );

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link className="mb-5 inline-flex items-center gap-2 text-sm text-slate-600" to="/">
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        {projectQuery.isLoading ? (
          <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">
            Loading project...
          </div>
        ) : projectQuery.isError || !project ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Could not load this project.
          </div>
        ) : (
          <>
            <header className="mb-6 rounded-lg border border-line bg-white p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <h1 className="text-2xl font-semibold tracking-normal">{project.name}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-slate-600">
                    {project.description || "No description"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>Created by {project.createdBy.name}</span>
                    <span>
                      Start {project.startDate ? formatDate(project.startDate) : "not set"}
                    </span>
                    <span>Created {formatDate(project.createdAt)}</span>
                    <span>Updated {formatDate(project.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => setIsProjectFormOpen(true)}>
                    <Edit size={16} />
                    Edit Project
                  </Button>
                  <Button onClick={() => setIsTaskFormOpen(true)}>
                    <Plus size={16} />
                    Create Task
                  </Button>
                  <Button
                    variant="danger"
                    disabled={deleteProjectMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete "${project.name}" and all its tasks?`)) {
                        deleteProjectMutation.mutate();
                      }
                    }}
                  >
                    <Trash2 size={16} />
                    Delete Project
                  </Button>
                </div>
              </div>
            </header>

            {reorderConflictMessage ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {reorderConflictMessage}
              </div>
            ) : null}

            <section className="mb-5 border-b border-line pb-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative block w-full lg:max-w-sm">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    className="focus-ring h-10 w-full rounded-md border border-line bg-white pl-9 pr-3 text-sm"
                    placeholder="Search tasks..."
                    value={controls.search}
                    onChange={(event) =>
                      setControls((current) => ({ ...current, search: event.target.value }))
                    }
                  />
                </label>

                <div className="relative flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                  <ToolbarButton
                    active={openPopover === "filter"}
                    onClick={() =>
                      setOpenPopover((current) => (current === "filter" ? null : "filter"))
                    }
                  >
                    <Filter size={16} />
                    Filter
                  </ToolbarButton>
                  <ToolbarButton
                    active={openPopover === "sort"}
                    onClick={() =>
                      setOpenPopover((current) => (current === "sort" ? null : "sort"))
                    }
                  >
                    <ArrowDownUp size={16} />
                    Sort
                  </ToolbarButton>
                  <ToolbarButton
                    active={openPopover === "group"}
                    onClick={() =>
                      setOpenPopover((current) => (current === "group" ? null : "group"))
                    }
                  >
                    <FolderKanban size={16} />
                    Group by
                  </ToolbarButton>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setControls(defaultControls);
                      setOpenPopover(null);
                    }}
                  >
                    <RotateCcw size={16} />
                    Reset
                  </Button>

                  {openPopover === "filter" ? (
                    <Popover title="Filter" onClose={() => setOpenPopover(null)}>
                      <FilterContent
                        controls={controls}
                        departments={departments}
                        people={people}
                        onChange={setControls}
                      />
                    </Popover>
                  ) : null}

                  {openPopover === "sort" ? (
                    <Popover title="Sort" onClose={() => setOpenPopover(null)}>
                      <SortContent controls={controls} onChange={setControls} />
                    </Popover>
                  ) : null}

                  {openPopover === "group" ? (
                    <Popover title="Group by" onClose={() => setOpenPopover(null)}>
                      <GroupContent controls={controls} onChange={setControls} />
                    </Popover>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {visibleTasks.length} of {project.tasks.length} tasks
                </span>
                {activeChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-line bg-white px-3 py-1 text-xs text-slate-600"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </section>

            {project.tasks.length ? (
              visibleTasks.length ? (
                controls.groupBy ? (
                  <div className="space-y-6">
                    {groupedTasks.map((group) => (
                      <section key={group.key}>
                        <div className="mb-3 flex items-center gap-2">
                          <h2 className="text-lg font-semibold">{group.name}</h2>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {group.tasks.length}
                          </span>
                        </div>
                        <KanbanBoard
                          tasks={group.tasks}
                          isSaving={reorderMutation.isPending}
                          isReorderDisabled={hasViewControls}
                          onOpenTask={setActivityTask}
                          onEditTask={(task) => {
                            setEditTaskConflictMessage("");
                            setEditingTask(task);
                          }}
                          onDeleteTask={(task) => {
                            if (window.confirm(`Delete "${task.title}"?`)) {
                              deleteTaskMutation.mutate(task.id);
                            }
                          }}
                          onReorder={(tasks) => reorderMutation.mutate(tasks)}
                        />
                      </section>
                    ))}
                  </div>
                ) : (
                  <KanbanBoard
                    tasks={visibleTasks}
                    isSaving={reorderMutation.isPending}
                    isReorderDisabled={hasViewControls}
                    onOpenTask={setActivityTask}
                    onEditTask={(task) => {
                      setEditTaskConflictMessage("");
                      setEditingTask(task);
                    }}
                    onDeleteTask={(task) => {
                      if (window.confirm(`Delete "${task.title}"?`)) {
                        deleteTaskMutation.mutate(task.id);
                      }
                    }}
                    onReorder={(tasks) => reorderMutation.mutate(tasks)}
                  />
                )
              ) : (
                <EmptyState message="No tasks match the current view controls." />
              )
            ) : (
              <EmptyState message="No tasks yet. Create the first task for this project." />
            )}
          </>
        )}
      </div>

      {project && isProjectFormOpen ? (
        <Modal title="Edit project" onClose={() => setIsProjectFormOpen(false)}>
          <ProjectForm
            people={people}
            project={{
              ...project,
              _count: { tasks: project.tasks.length }
            }}
            isSubmitting={updateProjectMutation.isPending}
            onSubmit={(payload) => updateProjectMutation.mutate(payload)}
          />
        </Modal>
      ) : null}

      {project && isTaskFormOpen ? (
        <Modal title="Create task" onClose={() => setIsTaskFormOpen(false)}>
          <TaskForm
            people={people}
            departments={departments}
            isSubmitting={createTaskMutation.isPending}
            onSubmit={(payload) => createTaskMutation.mutate(payload)}
          />
        </Modal>
      ) : null}

      {editingTask ? (
        <Modal
          title="Edit task"
          onClose={() => {
            setEditTaskConflictMessage("");
            setEditingTask(null);
          }}
        >
          {editTaskConflictMessage ? (
            <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {editTaskConflictMessage}
            </p>
          ) : null}
          <TaskForm
            people={people}
            departments={departments}
            task={editingTask}
            isSubmitting={updateTaskMutation.isPending}
            onSubmit={(payload) =>
              updateTaskMutation.mutate({
                id: editingTask.id,
                payload: { ...payload, version: editingTask.version }
              })
            }
          />
        </Modal>
      ) : null}

      {activityTask ? (
        <Modal title="Task activity" onClose={() => setActivityTask(null)}>
          <TaskActivityModal task={activityTask} />
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
      className={`focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition ${
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
    <div className="absolute right-0 top-12 z-30 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-line bg-white p-4 shadow-xl">
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
  controls,
  departments,
  people,
  onChange
}: {
  controls: typeof defaultControls;
  departments: { id: number; name: string }[];
  people: { id: number; name: string }[];
  onChange: React.Dispatch<React.SetStateAction<typeof defaultControls>>;
}) {
  return (
    <div className="space-y-3">
      <Select
        label="Priority"
        value={controls.priority}
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
        value={controls.status || (controls.statusNot === "DONE" ? "NOT_DONE" : "")}
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
          value={controls.departmentId}
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
          value={controls.assignedPersonId}
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
          value={controls.startDateFrom}
          onChange={(value) => onChange((current) => ({ ...current, startDateFrom: value }))}
        />
        <Input
          label="Started to"
          type="date"
          value={controls.startDateTo}
          onChange={(value) => onChange((current) => ({ ...current, startDateTo: value }))}
        />
      </div>

      <Select
        label="Incomplete duration"
        value={controls.incompleteForMoreThanDays}
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
  controls,
  onChange
}: {
  controls: typeof defaultControls;
  onChange: React.Dispatch<React.SetStateAction<typeof defaultControls>>;
}) {
  return (
    <div className="space-y-3">
      <Select
        label="Primary sort"
        value={controls.sort1}
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
        value={controls.sort2}
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
  controls,
  onChange
}: {
  controls: typeof defaultControls;
  onChange: React.Dispatch<React.SetStateAction<typeof defaultControls>>;
}) {
  return (
    <div className="space-y-2">
      {[
        { value: "", label: "No group", description: "Show one Kanban board." },
        { value: "department", label: "Department", description: "Group tasks by department." },
        { value: "person", label: "Person", description: "Group tasks by assigned person." }
      ].map((option) => (
        <button
          key={option.label}
          className={`focus-ring w-full rounded-md border px-3 py-2 text-left transition ${
            controls.groupBy === option.value
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

function buildVisibleTasks(tasks: Task[], controls: typeof defaultControls) {
  const query = controls.search.trim().toLowerCase();
  const startFrom = controls.startDateFrom ? new Date(controls.startDateFrom) : null;
  const startTo = controls.startDateTo ? endOfDay(new Date(controls.startDateTo)) : null;

  const filtered = tasks.filter((task) => {
    if (query) {
      const searchable = [
        task.title,
        task.description,
        task.assignedPerson?.name,
        task.department?.name,
        task.priority,
        task.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchable.includes(query)) {
        return false;
      }
    }

    if (controls.priority && task.priority !== controls.priority) {
      return false;
    }

    if (controls.status && task.status !== controls.status) {
      return false;
    }

    if (controls.statusNot && task.status === controls.statusNot) {
      return false;
    }

    if (controls.departmentId && task.departmentId !== controls.departmentId) {
      return false;
    }

    if (controls.assignedPersonId && task.assignedPersonId !== controls.assignedPersonId) {
      return false;
    }

    const taskStart = task.startDate ? new Date(task.startDate) : null;
    if (startFrom && (!taskStart || taskStart < startFrom)) {
      return false;
    }

    if (startTo && (!taskStart || taskStart > startTo)) {
      return false;
    }

    if (controls.incompleteForMoreThanDays !== "") {
      const duration = getIncompleteDurationDays(task);
      if (duration === null || duration <= controls.incompleteForMoreThanDays) {
        return false;
      }
    }

    return true;
  });

  const sorted = sortTasks(filtered, controls);

  if (!controls.sort1 && !controls.sort2) {
    return sorted;
  }

  const statusIndexes: Partial<Record<TaskStatus, number>> = {};
  return sorted.map((task) => {
    const nextIndex = statusIndexes[task.status] ?? 0;
    statusIndexes[task.status] = nextIndex + 1;
    return { ...task, sortOrder: nextIndex };
  });
}

function sortTasks(tasks: Task[], controls: typeof defaultControls) {
  const rules = [controls.sort1, controls.sort2].filter(Boolean);

  if (!rules.length) {
    return [...tasks];
  }

  return [...tasks].sort((a, b) => {
    for (const rule of rules) {
      let result = 0;

      if (rule === "priority_desc") {
        result = priorityRank[b.priority] - priorityRank[a.priority];
      } else if (rule === "priority_asc") {
        result = priorityRank[a.priority] - priorityRank[b.priority];
      } else if (rule === "startDate_asc") {
        result = compareDate(a.startDate ?? a.createdAt, b.startDate ?? b.createdAt, "asc");
      } else if (rule === "startDate_desc") {
        result = compareDate(a.startDate ?? a.createdAt, b.startDate ?? b.createdAt, "desc");
      } else if (rule === "duration_desc") {
        result = compareNumber(getIncompleteDurationDays(a), getIncompleteDurationDays(b), "desc");
      } else if (rule === "duration_asc") {
        result = compareNumber(getIncompleteDurationDays(a), getIncompleteDurationDays(b), "asc");
      } else if (rule === "updatedAt_desc") {
        result = compareDate(a.updatedAt, b.updatedAt, "desc");
      }

      if (result !== 0) {
        return result;
      }
    }

    return a.sortOrder - b.sortOrder;
  });
}

function groupTasks(tasks: Task[], groupBy: GroupBy | "") {
  if (!groupBy) {
    return [];
  }

  const groups = new Map<string, { key: string; name: string; tasks: Task[] }>();

  for (const task of tasks) {
    const id = groupBy === "department" ? task.departmentId : task.assignedPersonId;
    const name =
      groupBy === "department"
        ? task.department?.name ?? "No department"
        : task.assignedPerson?.name ?? "Unassigned";
    const key = `${id ?? "none"}:${name}`;

    if (!groups.has(key)) {
      groups.set(key, { key, name, tasks: [] });
    }

    groups.get(key)?.tasks.push(task);
  }

  return [...groups.values()];
}

function getIncompleteDurationDays(task: Task) {
  if (task.status === "DONE") {
    return null;
  }

  const start = new Date(task.startDate ?? task.createdAt);
  return Math.max(0, Math.floor((Date.now() - start.getTime()) / 86_400_000));
}

function compareDate(a: string | null, b: string | null, direction: "asc" | "desc") {
  const aTime = a ? new Date(a).getTime() : 0;
  const bTime = b ? new Date(b).getTime() : 0;
  return direction === "asc" ? aTime - bTime : bTime - aTime;
}

function compareNumber(a: number | null, b: number | null, direction: "asc" | "desc") {
  const aValue = a ?? -1;
  const bValue = b ?? -1;
  return direction === "asc" ? aValue - bValue : bValue - aValue;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function buildActiveChips(
  controls: typeof defaultControls,
  departments: { id: number; name: string }[],
  people: { id: number; name: string }[]
) {
  const chips: string[] = [];

  if (controls.status) {
    chips.push(`Status: ${statusLabels[controls.status]}`);
  } else if (controls.statusNot === "DONE") {
    chips.push("Status: Not Done");
  }

  if (controls.priority) {
    chips.push(`Priority: ${priorityLabels[controls.priority]}`);
  }

  if (controls.departmentId) {
    chips.push(`Department: ${departments.find((department) => department.id === controls.departmentId)?.name ?? controls.departmentId}`);
  }

  if (controls.assignedPersonId) {
    chips.push(`Person: ${people.find((person) => person.id === controls.assignedPersonId)?.name ?? controls.assignedPersonId}`);
  }

  if (controls.startDateFrom) {
    chips.push(`Started from: ${controls.startDateFrom}`);
  }

  if (controls.startDateTo) {
    chips.push(`Started to: ${controls.startDateTo}`);
  }

  if (controls.incompleteForMoreThanDays !== "") {
    chips.push(`Open > ${controls.incompleteForMoreThanDays} days`);
  }

  if (controls.sort1 || controls.sort2) {
    const sortLabels = [controls.sort1, controls.sort2]
      .filter(Boolean)
      .map((value) => sortOptions.find((option) => option.value === value)?.label ?? value);
    chips.push(`Sort: ${sortLabels.join(", ")}`);
  }

  if (controls.groupBy) {
    chips.push(`Group: ${controls.groupBy === "department" ? "Department" : "Person"}`);
  }

  return chips;
}
