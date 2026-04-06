"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc-client";
import { TaskCard } from "@/components/dashboard/TaskCard";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function AreaDetailPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = use(params);

  const { data: kpis } = trpc.reports.areaKPIs.useQuery({});
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    areaId,
    limit: 50,
  });

  const areaKpi = kpis?.find((k) => k.areaId === areaId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/areas"
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          {areaKpi && (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
              style={{
                backgroundColor: `${areaKpi.area?.color ?? "#6366f1"}20`,
              }}
            >
              {areaKpi.area?.icon ?? "🏢"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              {areaKpi?.area?.name ?? "Área"}
            </h1>
            <p className="text-sm text-zinc-500">
              {tasks?.pagination?.total ?? 0} tareas
            </p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      {areaKpi && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <BarChart3 className="mb-2 h-5 w-5 text-indigo-500" />
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {areaKpi.totalTasks}
            </div>
            <div className="text-xs text-zinc-500">Total tareas</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-500" />
            <div className="text-2xl font-bold text-emerald-600">
              {areaKpi.completed}
            </div>
            <div className="text-xs text-zinc-500">Completadas</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <Clock className="mb-2 h-5 w-5 text-amber-500" />
            <div className="text-2xl font-bold text-amber-600">
              {areaKpi.avgHours ? `${Math.round(areaKpi.avgHours)}h` : "—"}
            </div>
            <div className="text-xs text-zinc-500">Promedio horas</div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <AlertTriangle className="mb-2 h-5 w-5 text-red-500" />
            <div className="text-2xl font-bold text-red-600">
              {areaKpi.overdue}
            </div>
            <div className="text-xs text-zinc-500">Vencidas</div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Tareas del área
        </h2>
        {tasks?.tasks && tasks.tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500">
              No hay tareas en esta área
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
