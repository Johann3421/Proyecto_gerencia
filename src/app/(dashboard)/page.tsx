"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { useUIStore } from "@/store/ui-store";
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
  ShieldCheck,
  GridIcon,
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
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5, #6366f1, #4338ca)",
          borderRadius: "var(--radius-xl)",
          padding: 24,
          color: "white",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Mis tareas de hoy</h1>
            <p style={{ marginTop: 4, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
              {totalActive > 0
                ? `${totalActive} tarea${totalActive > 1 ? "s" : ""} pendiente${totalActive > 1 ? "s" : ""}`
                : "Todo en orden 🎯 — No hay tareas pendientes"}
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.15)",
              borderRadius: "var(--radius-lg)",
              padding: "8px 16px",
              backdropFilter: "blur(8px)",
            }}
          >
            <Flame className="h-5 w-5" style={{ color: "#fb923c" }} />
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.6)" }}>Racha</p>
              <p style={{ fontSize: 18, fontWeight: 700 }}>3 días</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {totalActive > 0 && (
          <div style={{ marginTop: 16 }}>
            <div className="flex items-center justify-between" style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              <span>Progreso del día</span>
              <span>
                {completedToday}/{completedToday + totalActive} completadas
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                height: 6,
                borderRadius: "100px",
                background: "rgba(255,255,255,0.2)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: "100px",
                  background: "white",
                  transition: "width 0.6s ease",
                  width: `${totalActive + completedToday > 0 ? (completedToday / (completedToday + totalActive)) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <div>
        <h2 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          Tareas prioritarias
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="nexus-skeleton" style={{ height: 96, borderRadius: "var(--radius-lg)" }} />
            ))}
          </div>
        ) : todayTasks.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={48} style={{ color: "var(--success)" }} />}
            title="Todo al día"
            subtitle="No tienes tareas pendientes por ahora."
          />
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
        className="fixed bottom-20 right-4 z-40 flex items-center justify-center lg:bottom-6"
        style={{
          width: 56,
          height: 56,
          borderRadius: "100%",
          background: "#4f46e5",
          color: "white",
          boxShadow: "0 8px 24px rgba(79,70,229,0.4)",
          transition: "transform 0.15s",
        }}
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
      !["COMPLETED", "APPROVED", "CANCELLED"].includes(t.status)
  );

  return (
    <div className="space-y-6">
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
        Panel de Supervisor
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={<Clock size={20} style={{ color: "var(--warning)" }} />}
          label="En revisión"
          value={awaitingReview.length}
          urgent={awaitingReview.length > 0}
        />
        <MetricCard
          icon={<AlertTriangle size={20} style={{ color: "var(--danger)" }} />}
          label="Vencidas"
          value={overdue.length}
          urgent={overdue.length > 0}
        />
        <MetricCard
          icon={<CheckCircle2 size={20} style={{ color: "var(--success)" }} />}
          label="Completadas"
          value={completionData?.completed ?? 0}
        />
        <MetricCard
          icon={<TrendingUp size={20} style={{ color: "var(--info)" }} />}
          label="Tasa completitud"
          value={`${completionData?.completionRate ?? 0}%`}
          rateValue={completionData?.completionRate}
        />
      </div>

      {/* Approvals pending */}
      {awaitingReview.length > 0 ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--warning)" }}>
              ⚡ Aprobaciones pendientes
            </h2>
            <Link href="/approvals" style={{ fontSize: 12, color: "#818cf8" }} className="hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {awaitingReview.slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<ShieldCheck size={48} style={{ color: "var(--success)" }} />}
          title="Sin pendientes"
          subtitle="No hay solicitudes esperando tu revisión."
        />
      )}

      {/* Recent tasks */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
            Tareas del equipo
          </h2>
          <Link href="/tasks" style={{ fontSize: 12, color: "#818cf8" }} className="hover:underline">
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
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: tasksData } = trpc.tasks.list.useQuery({ page: 1, limit: 20 });

  const tasks = tasksData?.tasks ?? [];
  const blocked = tasks.filter((t) => t.status === "BLOCKED");
  const critical = tasks.filter((t) => t.priority === "CRITICAL");
  const problems = [...blocked, ...critical].slice(0, 3);

  const rate = completionData?.completionRate ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
          Panel de Área
        </h1>
        <button
          className="flex items-center gap-1"
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-md)",
            background: "#4f46e5",
            color: "white",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <FileText className="h-4 w-4" />
          Exportar reporte
        </button>
      </div>

      {/* Health gauge */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
        }}
      >
        <h2 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          Salud del área
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={rate >= 71 ? "var(--success)" : rate >= 41 ? "var(--warning)" : "var(--danger)"}
                strokeWidth="8"
                strokeDasharray={`${Math.min(rate, 100) * 2.64} 264`}
                strokeLinecap="round"
              />
            </svg>
            <span
              className="absolute"
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: rate >= 71 ? "var(--success)" : rate >= 41 ? "var(--warning)" : "var(--danger)",
              }}
            >
              {rate}%
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2" style={{ fontSize: 14 }}>
              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
              <span style={{ color: "var(--text-secondary)" }}>
                {completionData?.completed ?? 0} completadas
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ fontSize: 14 }}>
              <Activity size={16} style={{ color: "var(--info)" }} />
              <span style={{ color: "var(--text-secondary)" }}>
                {completionData?.inProgress ?? 0} en progreso
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ fontSize: 14 }}>
              <AlertTriangle size={16} style={{ color: "var(--danger)" }} />
              <span style={{ color: "var(--text-secondary)" }}>
                {completionData?.overdue ?? 0} vencidas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 problems */}
      {problems.length > 0 && (
        <div>
          <h2 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--danger)" }}>
            🚨 Problemas activos
          </h2>
          <div className="space-y-2">
            {problems.map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        </div>
      )}

      {/* Week comparison */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
        }}
      >
        <h2 style={{ marginBottom: 16, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          Comparativa semanal
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="text-center"
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: 16,
            }}
          >
            <p style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)" }}>
              {completionData?.total ?? 0}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Tareas esta semana</p>
          </div>
          <div
            className="text-center"
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-md)",
              padding: 16,
            }}
          >
            <p style={{
              fontSize: 24,
              fontWeight: 700,
              color: rate >= 71 ? "var(--success)" : rate >= 41 ? "var(--warning)" : "var(--danger)",
            }}>
              {rate}%
            </p>
            <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Tasa de completitud</p>
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
  const rate = completionData?.completionRate ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
          Panel Global
        </h1>
        <div className="flex gap-2">
          <Link
            href="/team"
            className="flex items-center gap-1"
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-default)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            <Users className="h-4 w-4" />
            Crear usuario
          </Link>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={<GridIcon size={20} style={{ color: "var(--info)" }} />}
          label="Total tareas"
          value={completionData?.total ?? 0}
        />
        <MetricCard
          icon={<CheckCircle2 size={20} style={{ color: "var(--success)" }} />}
          label="Completadas"
          value={completionData?.completed ?? 0}
        />
        <MetricCard
          icon={<AlertTriangle size={20} style={{ color: "var(--danger)" }} />}
          label="Vencidas"
          value={completionData?.overdue ?? 0}
          urgent={(completionData?.overdue ?? 0) > 0}
        />
        <MetricCard
          icon={<TrendingUp size={20} style={{ color: "var(--info)" }} />}
          label="Tasa global"
          value={`${rate}%`}
          rateValue={rate}
        />
      </div>

      {/* Area health grid */}
      <div>
        <h2 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          Salud por área
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {areas.map((area) => (
            <Link
              key={area.areaId}
              href={`/areas/${area.areaId}`}
              style={{
                display: "block",
                background: "var(--bg-surface)",
                borderLeft: `3px solid ${area.color}`,
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "100%",
                    background: area.color,
                    flexShrink: 0,
                  }}
                />
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {area.name}
                </h3>
              </div>
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: area.overdueCount > 0 ? "var(--danger)" : "var(--text-muted)",
                    fontWeight: area.overdueCount > 0 ? 600 : 400,
                  }}
                >
                  {area.overdueCount} vencida{area.overdueCount !== 1 ? "s" : ""}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
          Actividad reciente
        </h2>
        {(tasksData?.tasks ?? []).length === 0 ? (
          <EmptyState
            icon={<Activity size={48} style={{ color: "var(--info)" }} />}
            title="Sin actividad reciente"
            subtitle="Las acciones del equipo aparecerán aquí."
          />
        ) : (
          <div className="space-y-2">
            {(tasksData?.tasks ?? []).slice(0, 5).map((task) => (
              <TaskCard key={task.id} task={task} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AUDITOR Dashboard ───────────────────────────────

function AuditorDashboard() {
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: overdueData } = trpc.reports.overdueByArea.useQuery();

  const rate = completionData?.completionRate ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
          Panel de Auditoría
        </h1>
        <div className="flex gap-2">
          <Link
            href="/reports"
            className="flex items-center gap-1"
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-md)",
              background: "#4f46e5",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Reportes completos
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={<ListTodo size={20} style={{ color: "var(--info)" }} />}
          label="Total tareas"
          value={completionData?.total ?? 0}
        />
        <MetricCard
          icon={<CheckCircle2 size={20} style={{ color: "var(--success)" }} />}
          label="Completadas"
          value={completionData?.completed ?? 0}
        />
        <MetricCard
          icon={<AlertTriangle size={20} style={{ color: "var(--danger)" }} />}
          label="Vencidas"
          value={completionData?.overdue ?? 0}
          urgent={(completionData?.overdue ?? 0) > 0}
        />
        <MetricCard
          icon={<TrendingUp size={20} style={{ color: "var(--info)" }} />}
          label="Completitud"
          value={`${rate}%`}
          rateValue={rate}
        />
      </div>

      {/* Overdue by area table */}
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        <div style={{ borderBottom: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
            Tareas vencidas por área
          </h2>
        </div>
        <div>
          {(overdueData ?? []).map((area, i) => (
            <div
              key={area.areaId}
              className="flex items-center justify-between"
              style={{
                padding: "12px 16px",
                borderBottom: i < (overdueData?.length ?? 0) - 1 ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ width: 10, height: 10, borderRadius: "100%", background: area.color }} />
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{area.name}</span>
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 28,
                  padding: "2px 8px",
                  borderRadius: "100px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: area.overdueCount === 0 ? "var(--success)" : "var(--danger)",
                  background: area.overdueCount === 0 ? "var(--success-bg)" : "var(--danger-bg)",
                }}
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

// ─── Reusable MetricCard ─────────────────────────────

function MetricCard({
  icon,
  label,
  value,
  urgent,
  rateValue,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  urgent?: boolean;
  rateValue?: number;
}) {
  // Dynamic color for rate
  let valueColor = "var(--text-primary)";
  if (rateValue !== undefined) {
    if (rateValue <= 40) valueColor = "var(--danger)";
    else if (rateValue <= 70) valueColor = "var(--warning)";
    else valueColor = "var(--success)";
  }
  if (urgent) valueColor = "var(--danger)";

  return (
    <div
      style={{
        background: urgent ? "var(--danger-bg)" : "var(--bg-surface)",
        border: `1px solid ${urgent ? "rgba(248,113,113,0.20)" : "var(--border-subtle)"}`,
        borderRadius: "var(--radius-lg)",
        padding: 16,
      }}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      </div>
      <p
        style={{
          marginTop: 8,
          fontSize: 28,
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "40px 24px",
      }}
    >
      {icon}
      <p style={{ marginTop: 12, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
        {title}
      </p>
      <p style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
        {subtitle}
      </p>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="nexus-skeleton" style={{ height: 160, borderRadius: "var(--radius-xl)" }} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="nexus-skeleton" style={{ height: 96, borderRadius: "var(--radius-lg)" }} />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="nexus-skeleton" style={{ height: 80, borderRadius: "var(--radius-lg)" }} />
        ))}
      </div>
    </div>
  );
}
