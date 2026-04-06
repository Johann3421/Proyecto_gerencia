"use client";

import Link from "next/link";
import { formatDueDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PriorityBadge } from "@/components/ui/PriorityBadge";
import type { TaskWithRelations } from "@/types";
import {
  Calendar,
  MessageSquare,
  Paperclip,
  GitBranch,
} from "lucide-react";

interface TaskCardProps {
  task: TaskWithRelations;
  compact?: boolean;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const due = formatDueDate(task.dueDate);
  const isBlockedOrCriticalOverdue = task.status === "BLOCKED" || (task.priority === "CRITICAL" && due.isOverdue);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="group block"
      style={{
        background: isBlockedOrCriticalOverdue ? "rgba(248,113,113,0.04)" : "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderLeft: isBlockedOrCriticalOverdue ? "3px solid var(--danger)" : "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: compact ? "12px 16px" : "16px 20px",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-default)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border-subtle)";
        if (isBlockedOrCriticalOverdue) e.currentTarget.style.borderLeftColor = "var(--danger)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Top: Priority badge + area badge + status */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />

          {/* Area badge */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 8px",
              borderRadius: "100px",
              fontSize: 10,
              fontWeight: 500,
              color: task.area.color,
              backgroundColor: `${task.area.color}1F`,
            }}
          >
            {task.area.name}
          </span>
        </div>

        {/* Status badge */}
        <StatusBadge status={task.status} />
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          transition: "color 0.15s",
        }}
        className="group-hover:text-indigo-400"
      >
        {task.title}
      </h3>

      {!compact && task.description && (
        <p
          className="line-clamp-2"
          style={{
            marginTop: 4,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          {task.description}
        </p>
      )}

      {/* Subtask progress */}
      {task._count.subtasks > 0 && (
        <div className="mt-2 flex items-center gap-2" style={{ color: "var(--text-muted)", fontSize: 10 }}>
          <GitBranch className="h-3 w-3" />
          <span>{task._count.subtasks} sub-tareas</span>
        </div>
      )}

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center justify-center text-white font-bold"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "100%",
                  background: "#4f46e5",
                  fontSize: 10,
                }}
                title={task.assignedTo.name}
              >
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              {!compact && (
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {task.assignedTo.name.split(" ")[0]}
                </span>
              )}
            </div>
          ) : (
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Sin asignar</span>
          )}
        </div>

        {/* Meta: due date, comments, evidence */}
        <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
          {task.dueDate && (
            <span
              className="flex items-center gap-1"
              style={{
                fontSize: 10,
                fontWeight: due.isOverdue ? 600 : 400,
                color: due.isOverdue ? "var(--danger)" : due.isUrgent ? "var(--warning)" : "var(--text-muted)",
              }}
            >
              <Calendar className="h-3 w-3" />
              {due.text}
            </span>
          )}

          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5" style={{ fontSize: 10 }}>
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}

          {task._count.evidence > 0 && (
            <span className="flex items-center gap-0.5" style={{ fontSize: 10 }}>
              <Paperclip className="h-3 w-3" />
              {task._count.evidence}
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {!compact && task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              style={{
                padding: "2px 6px",
                borderRadius: "var(--radius-sm)",
                fontSize: 9,
                fontWeight: 500,
                color: "white",
                backgroundColor: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
