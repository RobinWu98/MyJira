import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchPeople } from "../api/people";
import { deleteProject, fetchProject, updateProject } from "../api/projects";
import { createTask, deleteTask, reorderTasks, updateTask } from "../api/tasks";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { ProjectForm } from "../components/projects/ProjectForm";
import { TaskForm } from "../components/tasks/TaskForm";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import type { Task } from "../types";
import { formatDate } from "../utils/labels";

export function ProjectDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const projectId = Number(params.projectId);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const projectQuery = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: Number.isFinite(projectId)
  });

  const peopleQuery = useQuery({
    queryKey: ["people"],
    queryFn: fetchPeople
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
      setEditingTask(null);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    }
  });

  const project = projectQuery.data;
  const people = peopleQuery.data ?? [];

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

            {project.tasks.length ? (
              <KanbanBoard
                tasks={project.tasks}
                isSaving={reorderMutation.isPending}
                onEditTask={setEditingTask}
                onDeleteTask={(task) => {
                  if (window.confirm(`Delete "${task.title}"?`)) {
                    deleteTaskMutation.mutate(task.id);
                  }
                }}
                onReorder={(tasks) => reorderMutation.mutate(tasks)}
              />
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
            isSubmitting={createTaskMutation.isPending}
            onSubmit={(payload) => createTaskMutation.mutate(payload)}
          />
        </Modal>
      ) : null}

      {editingTask ? (
        <Modal title="Edit task" onClose={() => setEditingTask(null)}>
          <TaskForm
            people={people}
            task={editingTask}
            isSubmitting={updateTaskMutation.isPending}
            onSubmit={(payload) => updateTaskMutation.mutate({ id: editingTask.id, payload })}
          />
        </Modal>
      ) : null}
    </main>
  );
}
