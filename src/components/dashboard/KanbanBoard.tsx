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
import type { TaskWithRelations, TaskStatus } from "@/types";
import { TaskCard } from "@/components/dashboard/TaskCard";

const KANBAN_COLUMNS: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "BLOCKED",
  "AWAITING_REVIEW",
  "COMPLETED",
];

const COLUMN_CONFIG: Record<TaskStatus, {
  label: string;
  dotColor: string;
  borderTopColor: string;
  badgeBg: string;
  badgeColor: string;
}> = {
  PENDING:         { label: "Pendiente",    dotColor: "var(--status-pending)",   borderTopColor: "var(--status-pending)",   badgeBg: "rgba(144,144,168,0.10)", badgeColor: "var(--status-pending)" },
  IN_PROGRESS:     { label: "En progreso",  dotColor: "var(--status-progress)",  borderTopColor: "var(--status-progress)",  badgeBg: "rgba(96,165,250,0.10)",  badgeColor: "var(--status-progress)" },
  BLOCKED:         { label: "Bloqueado",    dotColor: "var(--status-blocked)",   borderTopColor: "var(--danger)",           badgeBg: "var(--danger-bg)",       badgeColor: "var(--danger)" },
  AWAITING_REVIEW: { label: "En revisión",  dotColor: "var(--status-review)",    borderTopColor: "var(--warning)",          badgeBg: "var(--warning-bg)",      badgeColor: "var(--warning)" },
  APPROVED:        { label: "Aprobado",     dotColor: "var(--status-approved)",  borderTopColor: "var(--success)",          badgeBg: "var(--success-bg)",      badgeColor: "var(--success)" },
  COMPLETED:       { label: "Completado",   dotColor: "var(--status-completed)", borderTopColor: "var(--success)",          badgeBg: "var(--success-bg)",      badgeColor: "var(--success)" },
  REJECTED:        { label: "Rechazado",    dotColor: "var(--status-rejected)",  borderTopColor: "var(--danger)",           badgeBg: "var(--danger-bg)",       badgeColor: "var(--danger)" },
  CANCELLED:       { label: "Cancelado",    dotColor: "var(--status-cancelled)", borderTopColor: "var(--text-disabled)",    badgeBg: "rgba(58,58,80,0.30)",    badgeColor: "var(--status-cancelled)" },
};

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
  const config = COLUMN_CONFIG[status];

  return (
    <div
      className="flex w-72 flex-shrink-0 flex-col"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderTop: `3px solid ${config.borderTopColor}`,
        borderRadius: "var(--radius-lg)",
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "100%",
              backgroundColor: config.dotColor,
              flexShrink: 0,
            }}
          />
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {config.label}
          </h3>
        </div>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 20,
            height: 20,
            padding: "0 6px",
            borderRadius: "100px",
            fontSize: 10,
            fontWeight: 700,
            color: config.badgeColor,
            backgroundColor: config.badgeBg,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
          {tasks.length === 0 && (
            <div
              className="flex items-center justify-center p-6"
              style={{
                border: "2px dashed var(--border-default)",
                borderRadius: "var(--radius-md)",
              }}
            >
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Sin tareas</p>
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
          <div style={{
            transform: "rotate(1deg)",
            opacity: 0.95,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}>
            <TaskCard task={activeTask} compact />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
