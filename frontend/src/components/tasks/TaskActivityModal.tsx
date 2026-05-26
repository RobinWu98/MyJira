import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  createTaskNote,
  fetchTaskLogs,
  fetchTaskNotifications,
  markTaskNotificationsRead,
  updateTask
} from "../../api/tasks";
import { useAuth } from "../../auth/AuthContext";
import type { Person, Task, TaskLog, TaskLogType, TaskStatus } from "../../types";
import {
  priorityBadgeClasses,
  priorityLabels,
  statusBadgeClasses,
  statuses,
  statusLabels
} from "../../utils/labels";
import { Button } from "../ui/Button";

type TaskActivityModalProps = {
  task: Task;
  people: Person[];
};

const activityLabels: Record<TaskLogType, string> = {
  TASK_CREATED: "Created",
  ASSIGNEE_CHANGED: "Assignee",
  PRIORITY_CHANGED: "Priority",
  NOTE: "Note"
};

export function TaskActivityModal({ task, people }: TaskActivityModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [mentionQuery, setMentionQuery] = useState("");
  const [isMentionMenuOpen, setIsMentionMenuOpen] = useState(false);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  const logsQuery = useQuery({
    queryKey: ["tasks", task.id, "logs"],
    queryFn: () => fetchTaskLogs(task.id)
  });
  const notificationsQuery = useQuery({
    queryKey: ["tasks", task.id, "notifications"],
    queryFn: () => fetchTaskNotifications(task.id)
  });

  const conversationLogs = useMemo(() => [...(logsQuery.data ?? [])].reverse(), [logsQuery.data]);
  const canChangeStatus =
    Boolean(user) && (user?.id === task.assignedPersonId || user?.id === task.createdByPersonId);

  const noteMutation = useMutation({
    mutationFn: () => createTaskNote(task.id, message),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "logs"] });
      queryClient.invalidateQueries({ queryKey: ["task-report"] });
    }
  });

  const readMutation = useMutation({
    mutationFn: () => markTaskNotificationsRead(task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id, "notifications"] });
      queryClient.invalidateQueries({ queryKey: ["task-report"] });
    }
  });

  const statusMutation = useMutation({
    mutationFn: (status: TaskStatus) => updateTask(task.id, { status, version: task.version }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", task.id] });
      queryClient.invalidateQueries({ queryKey: ["task-report"] });
    }
  });

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ block: "end" });
  }, [conversationLogs.length, noteMutation.isSuccess]);

  useEffect(() => {
    if ((notificationsQuery.data?.length ?? 0) > 0 && !readMutation.isPending) {
      readMutation.mutate();
    }
  }, [notificationsQuery.data?.length]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    noteMutation.mutate();
  }

  function handleMessageChange(value: string) {
    setMessage(value);
    const mention = getActiveMention(value);
    setMentionQuery(mention?.query ?? "");
    setIsMentionMenuOpen(Boolean(mention));
  }

  function selectMention(name: string) {
    setMessage((current) => replaceActiveMention(current, name));
    setMentionQuery("");
    setIsMentionMenuOpen(false);
  }

  const mentionOptions = people.filter((person) =>
    person.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

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
            <label className="inline-flex items-center gap-2">
              <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeClasses[task.status]}`}>
                Status
              </span>
              <select
                className="focus-ring h-8 rounded-md border border-line bg-white px-2 text-xs disabled:bg-slate-50 disabled:text-slate-500"
                disabled={!canChangeStatus || statusMutation.isPending}
                value={task.status}
                onChange={(event) => statusMutation.mutate(event.target.value as TaskStatus)}
                title={
                  canChangeStatus
                    ? "Change task status"
                    : "Only the task creator or assigned person can change status"
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {!canChangeStatus ? (
          <p className="mt-2 text-xs text-slate-500">
            Only the task creator or assigned person can change status.
          </p>
        ) : null}
        {statusMutation.isError ? (
          <p className="mt-2 text-xs text-red-700">Could not update status.</p>
        ) : null}
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
                people={people}
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
        <div className="relative flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              className="focus-ring min-h-20 w-full resize-none rounded-md border border-line px-3 py-2 text-sm"
              placeholder="Write a note... use @Name to notify someone"
              value={message}
              onBlur={() => {
                window.setTimeout(() => setIsMentionMenuOpen(false), 120);
              }}
              onChange={(event) => handleMessageChange(event.target.value)}
              onFocus={() => {
                if (getActiveMention(message)) {
                  setIsMentionMenuOpen(true);
                }
              }}
            />
            {isMentionMenuOpen ? (
              <div className="absolute bottom-full left-0 z-20 mb-2 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-white p-1 shadow-lg">
                {mentionOptions.length ? (
                  mentionOptions.map((person) => (
                    <button
                      key={person.id}
                      className="focus-ring flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-slate-50"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectMention(person.name);
                      }}
                      type="button"
                    >
                      <span>{person.name}</span>
                      <span className="text-xs text-slate-500">{person.department?.name ?? "No department"}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-slate-500">No matching people</div>
                )}
              </div>
            ) : null}
          </div>
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
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
          {people.map((person) => (
            <button
              key={person.id}
              className="focus-ring rounded-full border border-line bg-white px-2 py-1 transition hover:bg-slate-50"
              onClick={() => {
                setMessage((current) => appendMention(current, person.name));
                setIsMentionMenuOpen(false);
              }}
              type="button"
            >
              @{person.name}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}

function appendMention(message: string, name: string) {
  const suffix = message && !message.endsWith(" ") ? " " : "";
  return `${message}${suffix}@${name} `;
}

function getActiveMention(message: string) {
  const match = /(?:^|\s)@([^\s@]*)$/.exec(message);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    start: match.index + (match[0].startsWith(" ") ? 1 : 0),
    query: match[1]
  };
}

function replaceActiveMention(message: string, name: string) {
  const mention = getActiveMention(message);

  if (!mention) {
    return appendMention(message, name);
  }

  return `${message.slice(0, mention.start)}@${name} `;
}

function ConversationEntry({
  log,
  people,
  isOwnNote
}: {
  log: TaskLog;
  people: Person[];
  isOwnNote: boolean;
}) {
  if (log.type !== "NOTE") {
    return <SystemEvent log={log} />;
  }

  return (
    <article className={`flex ${isOwnNote ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] ${isOwnNote ? "text-right" : "text-left"}`}>
        <div className="mb-1 text-xs text-slate-500">
          {isOwnNote ? "You" : log.actor?.name ?? "Unknown user"} · {formatDateTime(log.createdAt)}
        </div>
        <div
          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
            isOwnNote
              ? "rounded-br-sm bg-slate-900 text-white"
              : "rounded-bl-sm border border-line bg-slate-100 text-slate-800"
          }`}
        >
          <p className="whitespace-pre-wrap text-left">
            <HighlightedMentions message={log.message} people={people} />
          </p>
        </div>
      </div>
    </article>
  );
}

function HighlightedMentions({ message, people }: { message: string; people: Person[] }) {
  const names = people
    .map((person) => person.name)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);
  const mentionPattern = names.length
    ? new RegExp(`(@(?:${names.join("|")}))(?=\\s|$|[,.!?;:])`, "gi")
    : /(@\S+)/g;
  const parts = message.split(mentionPattern);

  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("@") ? (
          <span
            key={`${part}-${index}`}
            className="rounded bg-amber-100 px-1 font-semibold text-amber-900"
          >
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function SystemEvent({ log }: { log: TaskLog }) {
  return (
    <div className="flex justify-center">
      <div className="max-w-[88%] rounded-full bg-slate-100 px-3 py-2 text-center text-xs text-slate-600">
        <span className="font-medium">{activityLabels[log.type]}</span>
        <span className="mx-1">·</span>
        <span>{log.message}</span>
        <span className="mx-1">·</span>
        <span>{formatDateTime(log.createdAt)}</span>
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
