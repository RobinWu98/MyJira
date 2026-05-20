import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { createProject, deleteProject, fetchProjects, updateProject } from "../api/projects";
import { fetchPeople } from "../api/people";
import { ProjectForm } from "../components/projects/ProjectForm";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { useAuth } from "../auth/AuthContext";
import type { ProjectSummary } from "../types";
import { formatDate, projectStatusBadgeClasses } from "../utils/labels";

type ProjectOverview = {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  status: "Empty" | "In Progress" | "Done";
  finishDate: string | null;
};

function getProjectOverview(project: ProjectSummary): ProjectOverview {
  const total = project.tasks.length;
  const todo = project.tasks.filter((task) => task.status === "TODO").length;
  const inProgress = project.tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const done = project.tasks.filter((task) => task.status === "DONE").length;
  const status = total === 0 ? "Empty" : done === total ? "Done" : "In Progress";
  const finishDates = project.tasks.map((task) => task.completedAt ?? task.updatedAt).sort();
  const finishDate =
    status === "Done"
      ? finishDates[finishDates.length - 1] ?? null
      : null;

  return {
    total,
    todo,
    inProgress,
    done,
    status,
    finishDate
  };
}

export function ProjectsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);
  const [viewingProject, setViewingProject] = useState<ProjectSummary | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects
  });

  const peopleQuery = useQuery({
    queryKey: ["people"],
    queryFn: fetchPeople
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsCreateOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateProject>[1] }) =>
      updateProject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    }
  });

  const people = peopleQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const canManageProjects = auth.user?.role === "ADMIN" || auth.user?.role === "MANAGER";

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">Create projects and manage their tasks.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageProjects ? (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus size={18} />
                Create Project
              </Button>
            ) : null}
            <Link
              className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-slate-50"
              to="/work"
            >
              Work View
            </Link>
            <Link
              className="focus-ring inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-slate-50"
              to="/profile"
            >
              {auth.user?.name ?? "Profile"}
            </Link>
          </div>
        </header>

        {projectsQuery.isLoading ? (
          <div className="rounded-lg border border-line bg-white p-6 text-sm text-slate-500">
            Loading projects...
          </div>
        ) : projectsQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Could not load projects.
          </div>
        ) : projects.length ? (
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-center text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Project name</th>
                    <th className="px-4 py-3 font-semibold">Total tasks</th>
                    <th className="px-4 py-3 font-semibold">To Do</th>
                    <th className="px-4 py-3 font-semibold">In Progress</th>
                    <th className="px-4 py-3 font-semibold">Done</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Finish date</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projects.map((project) => {
                    const overview = getProjectOverview(project);

                    return (
                      <tr key={project.id} className="align-top">
                        <td className="px-4 py-3 text-center font-medium">
                          <Link className="text-brand hover:underline" to={`/projects/${project.id}`}>
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{overview.total}</td>
                        <td className="px-4 py-3 text-slate-600">{overview.todo}</td>
                        <td className="px-4 py-3 text-slate-600">{overview.inProgress}</td>
                        <td className="px-4 py-3 text-slate-600">{overview.done}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`rounded-full border px-2 py-1 text-xs font-medium ${projectStatusBadgeClasses[overview.status]}`}>
                            {overview.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {overview.finishDate ? formatDate(overview.finishDate) : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="secondary"
                              className="h-8 px-2"
                              onClick={() => setViewingProject(project)}
                            >
                              <Eye size={15} />
                              View
                            </Button>
                            {canManageProjects ? (
                              <>
                                <Button
                                  variant="secondary"
                                  className="h-8 px-2"
                                  onClick={() => setEditingProject(project)}
                                >
                                  <Edit size={15} />
                                  Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  className="h-8 px-2"
                                  disabled={deleteMutation.isPending}
                                  onClick={() => {
                                    if (window.confirm(`Delete "${project.name}"?`)) {
                                      deleteMutation.mutate(project.id);
                                    }
                                  }}
                                >
                                  <Trash2 size={15} />
                                  Delete
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState message="No projects yet. Create the first project to start tracking tasks." />
        )}
      </div>

      {isCreateOpen ? (
        <Modal title="Create project" onClose={() => setIsCreateOpen(false)}>
          <ProjectForm
            people={people}
            isSubmitting={createMutation.isPending}
            onSubmit={(payload) => createMutation.mutate(payload)}
          />
        </Modal>
      ) : null}

      {editingProject ? (
        <Modal title="Edit project" onClose={() => setEditingProject(null)}>
          <ProjectForm
            people={people}
            project={editingProject}
            isSubmitting={updateMutation.isPending}
            onSubmit={(payload) => updateMutation.mutate({ id: editingProject.id, payload })}
          />
        </Modal>
      ) : null}

      {viewingProject ? (
        <Modal title="Project details" onClose={() => setViewingProject(null)}>
          <ProjectDetails project={viewingProject} />
        </Modal>
      ) : null}
    </main>
  );
}

function ProjectDetails({ project }: { project: ProjectSummary }) {
  const overview = getProjectOverview(project);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <h3 className="text-lg font-semibold">{project.name}</h3>
        <p className="mt-2 text-slate-600">{project.description || "No description"}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Detail label="Created by" value={project.createdBy.name} />
        <Detail label="Start date" value={project.startDate ? formatDate(project.startDate) : "No start date"} />
        <Detail label="Finish date" value={overview.finishDate ? formatDate(overview.finishDate) : "-"} />
        <Detail label="Status" value={overview.status} />
        <Detail label="Total tasks" value={String(overview.total)} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="To Do" value={overview.todo} />
        <Stat label="In Progress" value={overview.inProgress} />
        <Stat label="Done" value={overview.done} />
      </div>

      <div className="flex justify-end">
        <Link
          className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-brand px-3 text-sm font-medium text-white transition hover:bg-blue-700"
          to={`/projects/${project.id}`}
        >
          Open task board
        </Link>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-slate-50 px-3 py-2">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-white px-3 py-3 text-center">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
