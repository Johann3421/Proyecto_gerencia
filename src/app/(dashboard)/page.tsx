"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { useUIStore } from "@/store/ui-store";
import { cn, formatDueDate } from "@/lib/utils";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { QuickReportModal } from "@/components/forms/QuickReportModal";
import type { RoleType } from "@prisma/client";
import {
  ListTodo,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Plus,
  FileText,
  Activity,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as RoleType | undefined;

  if (!session?.user || !role) {
    return <DashboardSkeleton />;
  }

  return (
    <div>
      {role === "OPERARIO" && <OperarioDashboard />}
      {role === "SUPERVISOR" && <SupervisorDashboard />}
      {role === "ADMIN_AREA" && <AdminAreaDashboard />}
      {role === "SUPER_ADMIN" && <SuperAdminDashboard />}
      {role === "AUDITOR" && <AuditorDashboard />}
    </div>
  );
}

// ─── OPERARIO Dashboard ──────────────────────────────

function OperarioDashboard() {
  const { setQuickReportModalOpen, quickReportModalOpen } = useUIStore();

  const { data: tasksData, isLoading } = trpc.tasks.list.useQuery({
    status: undefined,
    page: 1,
    limit: 5,
  });

  const tasks = tasksData?.tasks ?? [];
  const todayTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
  );
  const completedToday = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalActive = todayTasks.length;

  return (
    <div className="space-y-6">
      {/* Hero: Mis tareas de hoy */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Mis tareas de hoy</h1>
            <p className="mt-1 text-sm text-indigo-200">
              {totalActive > 0
                ? `${totalActive} tarea${totalActive > 1 ? "s" : ""} pendiente${totalActive > 1 ? "s" : ""}`
                : "Todo en orden 🎯 — No hay tareas pendientes"}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 backdrop-blur-sm">
            <Flame className="h-5 w-5 text-orange-300" />
            <div>
              <p className="text-[10px] font-medium text-indigo-200">Racha</p>
              <p className="text-lg font-bold">3 días</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {totalActive > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-indigo-200">
              <span>Progreso del día</span>
              <span>
                {completedToday}/{completedToday + totalActive} completadas
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{
                  width: `${totalActive + completedToday > 0 ? (completedToday / (completedToday + totalActive)) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Tareas prioritarias
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Todo en orden 🎯
            </p>
            <p className="text-xs text-zinc-400">No hay tareas pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setQuickReportModalOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 lg:bottom-6"
        aria-label="Reportar problema"
      >
        <Plus className="h-6 w-6" />
      </button>

      {quickReportModalOpen && <QuickReportModal />}
    </div>
  );
}

// ─── SUPERVISOR Dashboard ────────────────────────────

function SupervisorDashboard() {
  const { data: tasksData } = trpc.tasks.list.useQuery({
    page: 1,
    limit: 50,
  });

  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});

  const tasks = tasksData?.tasks ?? [];
  const awaitingReview = tasks.filter((t) => t.status === "AWAITING_REVIEW");
  const overdue = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      !["COMPLETED", "CANCELLED"].includes(t.status)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
        Panel de Supervisor
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          icon={<Clock className="h-5 w-5 text-amber-500" />}
          label="En revisión"
          value={awaitingReview.length}
          color="amber"
          urgent={awaitingReview.length > 0}
        />
        <KPICard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Vencidas"
          value={overdue.length}
          color="red"
          urgent={overdue.length > 0}
        />
        <KPICard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Completadas"
          value={completionData?.completed ?? 0}
          color="emerald"
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5 text-indigo-500" />}
          label="Tasa completitud"
          value={`${completionData?.completionRate ?? 0}%`}
          color="indigo"
        />
      </div>

      {/* Approvals pending */}
      {awaitingReview.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              ⚡ Aprobaciones pendientes
            </h2>
            <Link href="/approvals" className="text-xs text-indigo-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {awaitingReview.slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tareas del equipo
          </h2>
          <Link href="/tasks" className="text-xs text-indigo-600 hover:underline">
            Ver todas
          </Link>
        </div>
        <div className="space-y-2">
          {tasks.slice(0, 5).map((task) => (
            <TaskCard key={task.id} task={task} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN_AREA Dashboard ────────────────────────────

function AdminAreaDashboard() {
  const { data: session } = useSession();
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: overdueData } = trpc.reports.overdueByArea.useQuery();
  const { data: tasksData } = trpc.tasks.list.useQuery({ page: 1, limit: 20 });

  const tasks = tasksData?.tasks ?? [];
  const blocked = tasks.filter((t) => t.status === "BLOCKED");
  const critical = tasks.filter((t) => t.priority === "CRITICAL");
  const problems = [...blocked, ...critical].slice(0, 3);

  const rate = completionData?.completionRate ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Panel de Área
        </h1>
        <button className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700">
          <FileText className="h-4 w-4" />
          Exportar reporte
        </button>
      </div>

      {/* Health gauge */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          Salud del área
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={rate >= 75 ? "#10b981" : rate >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="8"
                strokeDasharray={`${rate * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-2xl font-bold text-zinc-900 dark:text-white">
              {rate}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {completionData?.completed ?? 0} completadas
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {completionData?.inProgress ?? 0} en progreso
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {completionData?.overdue ?? 0} vencidas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 problems */}
      {problems.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-red-600">
            🚨 Problemas activos
          </h2>
          <div className="space-y-2">
            {problems.map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </div>
      )}

      {/* Week comparison placeholder */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          Comparativa semanal
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-900">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {completionData?.total ?? 0}
            </p>
            <p className="text-xs text-zinc-500">Tareas esta semana</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 text-center dark:bg-zinc-900">
            <p className="text-2xl font-bold text-emerald-600">{rate}%</p>
            <p className="text-xs text-zinc-500">Tasa de completitud</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUPER_ADMIN Dashboard ───────────────────────────

function SuperAdminDashboard() {
  const { data: overdueData } = trpc.reports.overdueByArea.useQuery();
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: tasksData } = trpc.tasks.list.useQuery({ page: 1, limit: 10 });

  const areas = overdueData ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Panel Global
        </h1>
        <div className="flex gap-2">
          <Link
            href="/team"
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700"
          >
            <Users className="h-4 w-4" />
            Crear usuario
          </Link>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          icon={<ListTodo className="h-5 w-5 text-indigo-500" />}
          label="Total tareas"
          value={completionData?.total ?? 0}
          color="indigo"
        />
        <KPICard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Completadas"
          value={completionData?.completed ?? 0}
          color="emerald"
        />
        <KPICard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Vencidas"
          value={completionData?.overdue ?? 0}
          color="red"
          urgent={(completionData?.overdue ?? 0) > 0}
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          label="Tasa global"
          value={`${completionData?.completionRate ?? 0}%`}
          color="blue"
        />
      </div>

      {/* Area health grid */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Salud por área
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {areas.map((area) => (
            <Link
              key={area.areaId}
              href={`/areas/${area.areaId}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: area.color }}
                />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {area.name}
                </h3>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Vencidas</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    area.overdueCount === 0
                      ? "bg-emerald-100 text-emerald-600"
                      : area.overdueCount <= 2
                        ? "bg-amber-100 text-amber-600"
                        : "bg-red-100 text-red-600"
                  )}
                >
                  {area.overdueCount}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Actividad reciente
        </h2>
        <div className="space-y-2">
          {(tasksData?.tasks ?? []).slice(0, 5).map((task) => (
            <TaskCard key={task.id} task={task} compact />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AUDITOR Dashboard ───────────────────────────────

function AuditorDashboard() {
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: overdueData } = trpc.reports.overdueByArea.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
          Panel de Auditoría
        </h1>
        <div className="flex gap-2">
          <Link
            href="/reports"
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700"
          >
            <BarChart3 className="h-4 w-4" />
            Reportes completos
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          icon={<ListTodo className="h-5 w-5 text-indigo-500" />}
          label="Total tareas"
          value={completionData?.total ?? 0}
          color="indigo"
        />
        <KPICard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          label="Completadas"
          value={completionData?.completed ?? 0}
          color="emerald"
        />
        <KPICard
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Vencidas"
          value={completionData?.overdue ?? 0}
          color="red"
        />
        <KPICard
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
          label="Completitud"
          value={`${completionData?.completionRate ?? 0}%`}
          color="blue"
        />
      </div>

      {/* Overdue by area table */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tareas vencidas por área
          </h2>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {(overdueData ?? []).map((area) => (
            <div key={area.areaId} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: area.color }} />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">{area.name}</span>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-bold",
                  area.overdueCount === 0
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                )}
              >
                {area.overdueCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Reusable KPI Card ───────────────────────────────

function KPICard({
  icon,
  label,
  value,
  color,
  urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 dark:bg-zinc-950",
        urgent
          ? "border-red-200 dark:border-red-900"
          : "border-zinc-200 dark:border-zinc-800"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-zinc-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
    </div>
  );
}

// ─── Loading skeleton ────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}
