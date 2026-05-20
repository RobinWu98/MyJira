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
import type { ProjectSummary } from "../types";
import { formatDate } from "../utils/labels";

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectSummary | null>(null);

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

  return (
    <main className="min-h-screen bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Projects</h1>
            <p className="mt-1 text-sm text-slate-500">Create projects and manage their tasks.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus size={18} />
            Create Project
          </Button>
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
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Project name</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Created by</th>
                    <th className="px-4 py-3 font-semibold">Tasks</th>
                    <th className="px-4 py-3 font-semibold">Last updated</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projects.map((project) => (
                    <tr key={project.id} className="align-top">
                      <td className="px-4 py-3 font-medium">{project.name}</td>
                      <td className="max-w-md px-4 py-3 text-slate-600">
                        {project.description || "No description"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{project.createdBy.name}</td>
                      <td className="px-4 py-3 text-slate-600">{project._count.tasks}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(project.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/projects/${project.id}`}
                            className="focus-ring inline-flex h-8 items-center justify-center gap-2 rounded-md border border-line bg-white px-2 text-sm font-medium text-ink transition hover:bg-slate-50"
                          >
                            <Eye size={15} />
                            View
                          </Link>
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
                        </div>
                      </td>
                    </tr>
                  ))}
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
    </main>
  );
}
