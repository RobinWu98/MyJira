import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createTaskNote, fetchTaskLogs } from "../../api/tasks";
import { useAuth } from "../../auth/AuthContext";
import type { Task, TaskLog, TaskLogType } from "../../types";
import {
  formatDate,
  priorityBadgeClasses,
  priorityLabels,
  statusBadgeClasses,
  statusLabels
} from "../../utils/labels";
import { Button } from "../ui/Button";

type TaskActivityModalProps = {
  task: Task;
};

const activityLabels: Record<TaskLogType, string> = {
  TASK_CREATED: "Created",
  ASSIGNEE_CHANGED: "Assignee",
  PRIORITY_CHANGED: "Priority",
  NOTE: "Note"
};

export function TaskActivityModal({ task }: TaskActivityModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const logsQuery = useQuery({
    queryKey: ["tasks", task.id, "logs"],
    queryFn: () => fetchTaskLogs(task.id)
  });

  const conversationLogs = useMemo(() => [...(logsQuery.data ?? [])].reverse(), [logsQuery.data]);

  const noteMutation = useMutation({
    mutationFn: () => createTaskNote(task.id, message),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "logs"] });
    }
  });

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ block: "end" });
  }, [conversationLogs.length, noteMutation.isSuccess]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    noteMutation.mutate();
  }

  return (
    <div className="flex min-h-[calc(85vh-6rem)] flex-col">
      <section className="shrink-0 border-b border-line pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">{task.title}</h3>
            {task.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${priorityBadgeClasses[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>
            <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClasses[task.status]}`}>
              {statusLabels[task.status]}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-2 py-1">
            {task.assignedPerson?.name ?? "Unassigned"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1">
            {task.department?.name ?? "No department"}
          </span>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-y-auto py-4">
        {logsQuery.isLoading ? (
          <div className="rounded-lg border border-line p-4 text-center text-sm text-slate-500">
            Loading conversation...
          </div>
        ) : logsQuery.isError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            Could not load conversation.
          </div>
        ) : conversationLogs.length ? (
          <div className="space-y-4">
            {conversationLogs.map((log) => (
              <ConversationEntry
                key={log.id}
                log={log}
                isOwnNote={log.type === "NOTE" && log.actorId === user?.id}
              />
            ))}
            <div ref={conversationEndRef} />
          </div>
        ) : (
          <div className="rounded-lg border border-line p-4 text-center text-sm text-slate-500">
            No conversation yet.
          </div>
        )}
      </section>

      <form className="sticky bottom-0 shrink-0 border-t border-line bg-white pt-4" onSubmit={handleSubmit}>
        <div className="flex items-end gap-2">
          <textarea
            className="focus-ring min-h-20 flex-1 resize-none rounded-md border border-line px-3 py-2 text-sm"
            placeholder="Write a note..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <Button
            aria-label="Send note"
            className="h-10 w-10 p-0"
            disabled={noteMutation.isPending || !message.trim()}
            type="submit"
          >
            <Send size={16} />
          </Button>
        </div>
        {noteMutation.isError ? (
          <p className="mt-2 text-sm text-red-700">Could not send note.</p>
        ) : null}
      </form>
    </div>
  );
}

function ConversationEntry({ log, isOwnNote }: { log: TaskLog; isOwnNote: boolean }) {
  if (log.type !== "NOTE") {
    return <SystemEvent log={log} />;
  }

  return (
    <article className={`flex ${isOwnNote ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] ${isOwnNote ? "text-right" : "text-left"}`}>
        <div className="mb-1 text-xs text-slate-500">
          {isOwnNote ? "You" : log.actor?.name ?? "Unknown user"} · {formatDate(log.createdAt)}
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isOwnNote
              ? "rounded-br-sm bg-slate-900 text-white"
              : "rounded-bl-sm border border-line bg-slate-100 text-slate-800"
          }`}
        >
          <p className="whitespace-pre-wrap text-left">{log.message}</p>
        </div>
      </div>
    </article>
  );
}

function SystemEvent({ log }: { log: TaskLog }) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[88%] rounded-full bg-slate-100 px-3 py-2 text-center text-xs text-slate-600">
        <span className="font-medium">{activityLabels[log.type]}</span>
        <span className="mx-1">·</span>
        <span>{log.message}</span>
        <span className="mx-1">·</span>
        <span>{formatDate(log.createdAt)}</span>
      </div>
    </div>
  );
}
