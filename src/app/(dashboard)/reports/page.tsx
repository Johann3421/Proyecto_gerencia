"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "quarter">(
    "month"
  );

  const startDate = (() => {
    const d = new Date();
    if (dateRange === "week") d.setDate(d.getDate() - 7);
    else if (dateRange === "month") d.setMonth(d.getMonth() - 1);
    else d.setMonth(d.getMonth() - 3);
    return d;
  })();

  const { data: kpis, isLoading: kpisLoading } =
    trpc.reports.areaKPIs.useQuery({});
  const { data: completionRate } = trpc.reports.taskCompletionRate.useQuery({
    from: startDate,
    to: new Date(),
  });
  const { data: overdue } = trpc.reports.overdueByArea.useQuery();
  const { data: productivity } = trpc.reports.userProductivity.useQuery({
    from: startDate,
    to: new Date(),
  });

  // Aggregated stats
  const totalTasks = kpis?.reduce((s, a) => s + a.totalTasks, 0) ?? 0;
  const totalCompleted =
    kpis?.reduce((s, a) => s + a.completed, 0) ?? 0;
  const totalOverdue = kpis?.reduce((s, a) => s + a.overdue, 0) ?? 0;
  const globalRate =
    totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            Reportes
          </h1>
          <p className="text-sm text-zinc-500">
            Métricas y análisis operacional
          </p>
        </div>
        {/* Date range selector */}
        <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700">
          {(["week", "month", "quarter"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors first:rounded-l-lg last:rounded-r-lg ${
                dateRange === r
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              {r === "week" ? "Semana" : r === "month" ? "Mes" : "Trimestre"}
            </button>
          ))}
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <BarChart3 className="mb-2 h-5 w-5 text-indigo-500" />
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {totalTasks}
          </div>
          <div className="text-xs text-zinc-500">Total tareas</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <CheckCircle2 className="mb-2 h-5 w-5 text-emerald-500" />
          <div className="text-2xl font-bold text-emerald-600">
            {globalRate}%
          </div>
          <div className="text-xs text-zinc-500">Tasa completado</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <AlertTriangle className="mb-2 h-5 w-5 text-red-500" />
          <div className="text-2xl font-bold text-red-600">{totalOverdue}</div>
          <div className="text-xs text-zinc-500">Tareas vencidas</div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <Clock className="mb-2 h-5 w-5 text-amber-500" />
          <div className="text-2xl font-bold text-amber-600">
            {completionRate?.inProgress ?? "—"}
          </div>
            <div className="text-xs text-zinc-500">En progreso</div>
        </div>
      </div>

      {/* Area comparison */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Rendimiento por Área
        </h2>
        <div className="space-y-3">
          {kpis?.map((area) => {
            const rate =
              area.totalTasks > 0
                ? Math.round((area.completed / area.totalTasks) * 100)
                : 0;
            return (
              <div key={area.id}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{area.area?.icon ?? "🏢"}</span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {area.area?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>
                      {area.completed}/{area.totalTasks}
                    </span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {rate}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      rate >= 80
                        ? "bg-emerald-500"
                        : rate >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Overdue by area */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Vencidas por Área
          </h2>
          {overdue && overdue.length > 0 ? (
            <div className="space-y-2">
              {overdue.map((item) => (
                <div
                  key={item.areaId}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
                >
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {item.name}
                  </span>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                    {item.overdueCount}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Sin tareas vencidas</p>
          )}
        </div>

        {/* Top productivity */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Top Productividad
          </h2>
          {productivity && productivity.length > 0 ? (
            <div className="space-y-2">
              {productivity.map((user, i) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                      {i + 1}
                    </span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {user.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      {user.completedTasks}
                    </span>
                    <span className="ml-1 text-[10px] text-zinc-400">
                      completadas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Sin datos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
}
