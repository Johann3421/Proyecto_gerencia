"use client";

import Link from "next/link";
import { cn, formatDueDate } from "@/lib/utils";
import { STATUS_CONFIG, PRIORITY_CONFIG, type TaskWithRelations } from "@/types";
import {
  Calendar,
  MessageSquare,
  Paperclip,
  GitBranch,
  AlertTriangle,
} from "lucide-react";

interface TaskCardProps {
  task: TaskWithRelations;
  compact?: boolean;
  onStatusChange?: (taskId: string, newStatus: string) => void;
}

export function TaskCard({ task, compact = false, onStatusChange }: TaskCardProps) {
  const statusCfg = STATUS_CONFIG[task.status];
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const due = formatDueDate(task.dueDate);

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={cn(
        "group block rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md dark:bg-zinc-950",
        task.status === "BLOCKED" && "border-l-4 border-l-red-500",
        task.status !== "BLOCKED" && "border-zinc-200 dark:border-zinc-800"
      )}
    >
      {/* Top: Priority badge + status */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Priority dot */}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              priorityCfg.bgColor,
              priorityCfg.color,
              task.priority === "CRITICAL" && "animate-pulse"
            )}
          >
            {task.priority === "CRITICAL" && <AlertTriangle className="h-3 w-3" />}
            {priorityCfg.label}
          </span>

          {/* Area badge */}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: task.area.color }}
          >
            {task.area.name}
          </span>
        </div>

        {/* Status */}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            statusCfg.bgColor,
            statusCfg.color
          )}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
        {task.title}
      </h3>

      {!compact && task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
          {task.description}
        </p>
      )}

      {/* Subtask progress bar */}
      {task._count.subtasks > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500">
            <GitBranch className="h-3 w-3" />
            <span>{task._count.subtasks} sub-tareas</span>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="mt-3 flex items-center justify-between">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600"
                title={task.assignedTo.name}
              >
                {task.assignedTo.name.charAt(0).toUpperCase()}
              </div>
              {!compact && (
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  {task.assignedTo.name.split(" ")[0]}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-zinc-400">Sin asignar</span>
          )}
        </div>

        {/* Meta: due date, comments, evidence */}
        <div className="flex items-center gap-3 text-zinc-400">
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                due.isOverdue && "font-semibold text-red-500",
                due.isUrgent && !due.isOverdue && "text-amber-500"
              )}
            >
              <Calendar className="h-3 w-3" />
              {due.text}
            </span>
          )}

          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}

          {task._count.evidence > 0 && (
            <span className="flex items-center gap-0.5 text-[10px]">
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
              className="rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
