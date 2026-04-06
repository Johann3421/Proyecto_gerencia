"use client";

import { trpc } from "@/lib/trpc-client";
import { useSession } from "next-auth/react";
import {
  Building2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function AreasPage() {
  const { data: session } = useSession();
  const { data: kpis, isLoading } = trpc.reports.areaKPIs.useQuery({});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Áreas
        </h1>
        <p className="text-sm text-zinc-500">
          Organigrama y estado operacional por área
        </p>
      </div>

      {/* Area grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis?.map((kpi) => {
          const completionRate =
            kpi.totalTasks > 0
              ? Math.round((kpi.completed / kpi.totalTasks) * 100)
              : 0;

          return (
            <Link
              key={kpi.id}
              href={`/areas/${kpi.areaId}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-900"
            >
              {/* Area header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                    style={{ backgroundColor: `${kpi.area?.color ?? "#6366f1"}20` }}
                  >
                    {kpi.area?.icon ?? "🏢"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                      {kpi.area?.name ?? "Área"}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {kpi.period}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-zinc-600" />
              </div>

              {/* Completion bar */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-zinc-500">Completado</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {completionRate}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      completionRate >= 80
                        ? "bg-emerald-500"
                        : completionRate >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-zinc-50 p-2 text-center dark:bg-zinc-900">
                  <div className="text-sm font-bold text-zinc-900 dark:text-white">
                    {kpi.totalTasks}
                  </div>
                  <div className="text-[10px] text-zinc-500">Total</div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2 text-center dark:bg-emerald-950/30">
                  <div className="text-sm font-bold text-emerald-600">
                    {kpi.completed}
                  </div>
                  <div className="text-[10px] text-zinc-500">Completadas</div>
                </div>
                <div className="rounded-lg bg-red-50 p-2 text-center dark:bg-red-950/30">
                  <div className="text-sm font-bold text-red-600">
                    {kpi.overdue}
                  </div>
                  <div className="text-[10px] text-zinc-500">Vencidas</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(!kpis || kpis.length === 0) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="font-medium text-zinc-600 dark:text-zinc-400">
            No hay áreas configuradas
          </p>
        </div>
      )}
    </div>
  );
}
