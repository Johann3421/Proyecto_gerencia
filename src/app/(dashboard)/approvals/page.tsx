"use client";

import { trpc } from "@/lib/trpc-client";

import {
  ShieldCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";

export default function ApprovalsPage() {

  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    status: "AWAITING_REVIEW",
    limit: 50,
  });

  const pendingTasks = tasks?.tasks ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="nexus-skeleton" style={{ width: 150, height: 24, marginBottom: 8 }} />
          <div className="nexus-skeleton" style={{ width: 220, height: 16 }} />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="nexus-skeleton" style={{ height: 100, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
          Aprobaciones
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
          {pendingTasks.length} tareas esperando revisión
        </p>
      </div>

      {pendingTasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 48,
          }}
        >
          <ShieldCheck size={48} style={{ color: "var(--success)", marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            Sin pendientes
          </p>
          <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
            No hay solicitudes esperando tu revisión.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderLeft: "3px solid var(--warning)",
                borderRadius: "var(--radius-lg)",
                padding: 16,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/tasks/${task.id}`}
                    style={{ fontWeight: 500, color: "var(--text-primary)", transition: "color 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#818cf8"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
                  >
                    {task.title}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-2" style={{ fontSize: 12 }}>
                    {task.assignedTo && (
                      <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                        <span
                          className="flex items-center justify-center text-white font-bold"
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "100%",
                            background: "#4f46e5",
                            fontSize: 8,
                          }}
                        >
                          {task.assignedTo.name?.[0]}
                        </span>
                        {task.assignedTo.name}
                      </span>
                    )}
                    {task.area && (
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "100px",
                          fontSize: 11,
                          color: task.area.color,
                          background: `${task.area.color}1F`,
                        }}
                      >
                        {task.area.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <Clock className="h-3 w-3" />
                        {formatRelativeDate(new Date(task.dueDate))}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="line-clamp-2" style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="flex items-center gap-1.5"
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-md)",
                      background: "#4f46e5",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    Revisar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
