"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { KanbanBoard } from "@/components/dashboard/KanbanBoard";
import { useUIStore } from "@/store/ui-store";
import {
  LayoutGrid,
  List,
  Plus,
  Filter,
  Search,
  X,
  ChevronDown,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import type { TaskStatus, Priority, RoleType } from "@prisma/client";

const STATUS_OPTIONS: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "BLOCKED",
  "AWAITING_REVIEW",
  "COMPLETED",
  "CANCELLED",
];

const PRIORITY_OPTIONS: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export default function TasksPage() {
  const { data: session } = useSession();
  const { kanbanView, setKanbanView } = useUIStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const role = session?.user?.role as RoleType | undefined;
  const canCreate =
    role &&
    ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR"].includes(role);

  const { data, isLoading } = trpc.tasks.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    page,
    limit: 20,
  });

  const tasks = data?.tasks ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const activeFilters =
    (statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0) + (search ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
            Tareas
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            {total} tareas en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex"
            style={{
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setKanbanView(false)}
              className="p-2"
              style={{
                background: !kanbanView ? "rgba(99,102,241,0.12)" : "transparent",
                color: !kanbanView ? "#818cf8" : "var(--text-muted)",
              }}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setKanbanView(true)}
              className="p-2"
              style={{
                background: kanbanView ? "rgba(99,102,241,0.12)" : "transparent",
                color: kanbanView ? "#818cf8" : "var(--text-muted)",
              }}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {canCreate && (
            <Link
              href="/tasks/new"
              className="flex items-center gap-1.5"
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-md)",
                background: "#4f46e5",
                color: "white",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nueva tarea</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar tareas..."
              style={{
                height: 40,
                width: "100%",
                paddingLeft: 36,
                paddingRight: 16,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#818cf8";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(129,140,248,0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative flex items-center gap-1.5"
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${showFilters || activeFilters > 0 ? "#818cf8" : "var(--border-default)"}`,
              background: showFilters || activeFilters > 0 ? "rgba(99,102,241,0.08)" : "transparent",
              color: showFilters || activeFilters > 0 ? "#818cf8" : "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilters > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  borderRadius: "100%",
                  background: "#4f46e5",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div
            className="flex flex-wrap items-center gap-2"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: 12,
            }}
          >
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as TaskStatus | "");
                  setPage(1);
                }}
                style={{
                  height: 36,
                  paddingLeft: 12,
                  paddingRight: 32,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                  appearance: "none",
                }}
              >
                <option value="">Todos los estados</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            </div>

            {/* Priority */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as Priority | "");
                  setPage(1);
                }}
                style={{
                  height: 36,
                  paddingLeft: 12,
                  paddingRight: 32,
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                  appearance: "none",
                }}
              >
                <option value="">Todas las prioridades</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p]?.label ?? p}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1"
                style={{ padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--danger)" }}
              >
                <X className="h-3 w-3" />
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="nexus-skeleton" style={{ height: 80, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 48,
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: "100%",
              background: "var(--bg-elevated)",
              marginBottom: 12,
            }}
          >
            <ListTodo size={24} style={{ color: "var(--text-muted)" }} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
            No se encontraron tareas
          </p>
          <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
            {activeFilters > 0
              ? "Intenta con otros filtros"
              : "Las tareas aparecerán aquí cuando se creen"}
          </p>
        </div>
      ) : kanbanView ? (
        <KanbanBoard tasks={tasks} />
      ) : (
        <>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  opacity: page === 1 ? 0.4 : 1,
                }}
              >
                Anterior
              </button>
              <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
                {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
