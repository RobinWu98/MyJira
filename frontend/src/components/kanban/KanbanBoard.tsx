import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Task, TaskStatus } from "../../types";
import { priorityLabels, statuses, statusLabels } from "../../utils/labels";
import { Button } from "../ui/Button";

type BoardState = Record<TaskStatus, Task[]>;

type KanbanBoardProps = {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onReorder: (tasks: { id: number; status: TaskStatus; sortOrder: number }[]) => void;
  isSaving: boolean;
};

function toBoardState(tasks: Task[]): BoardState {
  return statuses.reduce((board, status) => {
    board[status] = tasks
      .filter((task) => task.status === status)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return board;
  }, {} as BoardState);
}

function findTask(board: BoardState, taskId: number) {
  for (const status of statuses) {
    const index = board[status].findIndex((task) => task.id === taskId);
    if (index !== -1) {
      return { status, index, task: board[status][index] };
    }
  }

  return null;
}

function flattenBoard(board: BoardState) {
  return statuses.flatMap((status) =>
    board[status].map((task, index) => ({
      id: task.id,
      status,
      sortOrder: index
    }))
  );
}

export function KanbanBoard({
  tasks,
  onEditTask,
  onDeleteTask,
  onReorder,
  isSaving
}: KanbanBoardProps) {
  const initialBoard = useMemo(() => toBoardState(tasks), [tasks]);
  const [board, setBoard] = useState<BoardState>(initialBoard);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard]);

  function moveTask(activeId: number, overId: string | number) {
    const active = findTask(board, activeId);
    if (!active) {
      return board;
    }

    const overStatus = statuses.includes(overId as TaskStatus)
      ? (overId as TaskStatus)
      : findTask(board, Number(overId))?.status;

    if (!overStatus) {
      return board;
    }

    const overIndex = statuses.includes(overId as TaskStatus)
      ? board[overStatus].length
      : findTask(board, Number(overId))?.index ?? board[overStatus].length;

    if (active.status === overStatus) {
      return {
        ...board,
        [active.status]: arrayMove(board[active.status], active.index, overIndex)
      };
    }

    const nextSource = board[active.status].filter((task) => task.id !== activeId);
    const nextTarget = [...board[overStatus]];
    nextTarget.splice(overIndex, 0, { ...active.task, status: overStatus });

    return {
      ...board,
      [active.status]: nextSource,
      [overStatus]: nextTarget
    };
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(Number(event.active.id));
  }

  function handleDragOver(event: DragOverEvent) {
    const activeId = Number(event.active.id);
    const overId = event.over?.id;

    if (!overId) {
      return;
    }

    const nextBoard = moveTask(activeId, overId);
    setBoard(nextBoard);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);

    if (!event.over) {
      setBoard(initialBoard);
      return;
    }

    onReorder(flattenBoard(board));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kanban board</h2>
        {isSaving ? <span className="text-sm text-slate-500">Saving board...</span> : null}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={board[status] ?? []}
              activeTaskId={activeTaskId}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  activeTaskId,
  onEditTask,
  onDeleteTask
}: {
  status: TaskStatus;
  tasks: Task[];
  activeTaskId: number | null;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <section ref={setNodeRef} className="min-h-80 rounded-lg border border-line bg-white p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{statusLabels[status]}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={activeTaskId === task.id}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task)}
            />
          ))}
          {!tasks.length ? (
            <div className="rounded-md border border-dashed border-line px-3 py-8 text-center text-sm text-slate-400">
              No tasks
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

function TaskCard({
  task,
  isDragging,
  onEdit,
  onDelete
}: {
  task: Task;
  isDragging: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`rounded-md border border-line bg-white p-3 shadow-sm ${isDragging ? "opacity-60" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium leading-snug">{task.title}</h4>
          {task.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            aria-label="Edit task"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Pencil size={15} />
          </Button>
          <Button
            aria-label="Delete task"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-700"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 size={15} />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">
          {priorityLabels[task.priority]}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
          {task.assignedPerson?.name ?? "Unassigned"}
        </span>
      </div>
    </article>
  );
}
