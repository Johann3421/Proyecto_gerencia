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
  Loader2,
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
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Tareas
          </h1>
          <p className="text-sm text-zinc-500">
            {total} tareas en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setKanbanView(false)}
              className={`rounded-l-lg p-2 text-sm ${
                !kanbanView
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setKanbanView(true)}
              className={`rounded-r-lg p-2 text-sm ${
                kanbanView
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {canCreate && (
            <Link
              href="/tasks/new"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar tareas..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
              showFilters || activeFilters > 0
                ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
            {activeFilters > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as TaskStatus | "");
                  setPage(1);
                }}
                className="h-9 appearance-none rounded-lg border border-zinc-200 bg-white px-3 pr-8 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Todos los estados</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s]?.label ?? s}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            </div>

            {/* Priority */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as Priority | "");
                  setPage(1);
                }}
                className="h-9 appearance-none rounded-lg border border-zinc-200 bg-white px-3 pr-8 text-xs outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="">Todas las prioridades</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_CONFIG[p]?.label ?? p}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            </div>

            {activeFilters > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <List className="h-6 w-6 text-zinc-400" />
          </div>
          <p className="font-medium text-zinc-600 dark:text-zinc-400">
            No se encontraron tareas
          </p>
          <p className="mt-1 text-sm text-zinc-400">
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
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
              >
                Anterior
              </button>
              <span className="text-sm text-zinc-500">
                {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-700"
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
