"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG, type TaskWithRelations, type TaskStatus } from "@/types";
import { TaskCard } from "@/components/dashboard/TaskCard";

const KANBAN_COLUMNS: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "BLOCKED",
  "AWAITING_REVIEW",
  "COMPLETED",
];

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

function SortableTaskCard({ task }: { task: TaskWithRelations }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} compact />
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
}: {
  status: TaskStatus;
  tasks: TaskWithRelations[];
}) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "flex w-72 flex-shrink-0 flex-col rounded-xl border bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50",
        status === "BLOCKED" && "border-l-4 border-l-red-500",
        status !== "BLOCKED" && "border-zinc-200"
      )}
    >
      {/* Column header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", config.bgColor.replace("bg-", "bg-"))} 
                style={{ backgroundColor: config.color.replace("text-", "").includes("gray") ? "#9ca3af" : 
                         config.color.includes("blue") ? "#2563eb" : 
                         config.color.includes("red") ? "#dc2626" :
                         config.color.includes("amber") ? "#d97706" :
                         config.color.includes("green") ? "#16a34a" :
                         config.color.includes("emerald") ? "#059669" : "#6b7280" }} />
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {config.label}
          </h3>
        </div>
        <span className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
          config.bgColor,
          config.color
        )}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {tasks.length === 0 && (
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 p-6 dark:border-zinc-700">
              <p className="text-xs text-zinc-400">Sin tareas</p>
            </div>
          )}
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const tasksByStatus = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, TaskWithRelations[]>
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task ?? null);
  }, [tasks]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over || !onStatusChange) return;

      const taskId = active.id as string;
      const overTask = tasks.find((t) => t.id === over.id);

      if (overTask && overTask.status !== activeTask?.status) {
        onStatusChange(taskId, overTask.status);
      }
    },
    [activeTask, onStatusChange, tasks]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status] ?? []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 scale-105 opacity-80">
            <TaskCard task={activeTask} compact />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
