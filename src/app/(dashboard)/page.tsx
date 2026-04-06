"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import type { RoleType } from "@prisma/client";
import {
  Check,
  AlertCircle,
  TrendingUp,
  Clock,
  Square,
  CheckSquare,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

// Make sure we have a working Grid icon
import { Grid } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as RoleType | undefined;

  if (!session?.user || !role) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      {role === "SUPERVISOR" && <SupervisorDashboard />}
      {role === "ADMIN_AREA" && <AdminAreaDashboard />}
      {role === "SUPER_ADMIN" && <SuperAdminDashboard />}
      {role === "AUDITOR" && <AuditorDashboard />}
      {role === "OPERARIO" && <OperarioDashboard />}
    </>
  );
}

// ─── Shared Components ────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, color: "var(--text-3)",
      letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8, marginTop: 24
    }}>
      {children}
    </div>
  );
}

function StatStrip({ stats }: {
  stats: { label: string; value: string | number; icon: React.ElementType; color: string; iconColor?: string }[]
}) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--r)", display: "flex", overflow: "hidden"
    }}>
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} style={{
            flex: 1, padding: "14px 18px",
            borderRight: i < stats.length - 1 ? "1px solid var(--border-light)" : "none"
          }}>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
              <Icon size={12} color={stat.iconColor ?? stat.color} />
              {stat.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompactTaskList({ tasks, limit = 5 }: { tasks: any[], limit?: number }) {
  if (tasks.length === 0) return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 24, textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>
      No hay tareas para mostrar.
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
      {tasks.slice(0, limit).map((task) => {
        const isCritical = task.priority === "CRITICAL";
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !["COMPLETED", "APPROVED", "CANCELLED"].includes(task.status);
        const isBlocked = task.status === "BLOCKED";
        const highlighted = isCritical && isBlocked && isOverdue;

        const prioColor = task.priority === "CRITICAL" ? "var(--bad)" : task.priority === "HIGH" ? "#f59e0b" : task.priority === "MEDIUM" ? "#3b82f6" : "var(--text-3)";
        
        let areaBg = "#f4f4f5", areaColor = "#52525b";
        if (task.area?.name) {
          const l = task.area.name.toLowerCase();
          if (l.includes("admin")) { areaBg = "#eef2ff"; areaColor = "#3730a3"; }
          else if (l.includes("tec")) { areaBg = "#e0f2fe"; areaColor = "#0c4a6e"; }
          else if (l.includes("comer")) { areaBg = "#dcfce7"; areaColor = "#14532d"; }
          else if (l.includes("log")) { areaBg = "#fff7ed"; areaColor = "#9a3412"; }
          else if (l.includes("prod")) { areaBg = "#fee2e2"; areaColor = "#991b1b"; }
          else { areaBg = `${task.area.color}15`; areaColor = task.area.color; }
        }

        let statBg = "#f4f4f5", statColor = "#52525b", statLabel = "Pendiente";
        switch (task.status) {
          case "IN_PROGRESS": statBg = "#eff6ff"; statColor = "#1d4ed8"; statLabel = "En progreso"; break;
          case "BLOCKED": statBg = "#fee2e2"; statColor = "#991b1b"; statLabel = "Bloqueado"; break;
          case "AWAITING_REVIEW": statBg = "#fef9c3"; statColor = "#854d0e"; statLabel = "En revisión"; break;
          case "APPROVED": statBg = "#dcfce7"; statColor = "#14532d"; statLabel = "Aprobado"; break;
          case "COMPLETED": statBg = "#dcfce7"; statColor = "#14532d"; statLabel = "Completado"; break;
        }

        const dateDue = task.dueDate ? new Date(task.dueDate) : null;
        let dateColor = "var(--text-3)", dateText = "";
        if (dateDue) {
          const relativeMs = dateDue.getTime() - new Date().getTime();
          const relativeDays = Math.ceil(relativeMs / (1000 * 60 * 60 * 24));
          
          if (["COMPLETED", "APPROVED"].includes(task.status)) {
            dateText = "Completada";
          } else if (relativeDays < 0) {
            dateColor = "var(--bad)"; dateText = "Vencida";
          } else if (relativeDays === 0) {
            dateColor = "var(--warn)"; dateText = "Vence hoy";
          } else if (relativeDays === 1) {
            dateColor = "var(--warn)"; dateText = "Mañana";
          } else {
            dateText = `En ${relativeDays} d`;
          }
        }

        return (
          <Link key={task.id} href={`/tasks/${task.id}`} style={{
            display: "flex", alignItems: "center", padding: highlighted ? "0 14px 0 12px" : "0 14px",
            minHeight: 44, borderBottom: "1px solid var(--border-light)", textDecoration: "none",
            background: highlighted ? "#fffafa" : "transparent",
            borderLeft: highlighted ? "2px solid var(--bad)" : "none",
            transition: "background 0.1s"
          }}
          onMouseEnter={e => { if(!highlighted) e.currentTarget.style.background = "var(--surface-alt)" }}
          onMouseLeave={e => { if(!highlighted) e.currentTarget.style.background = "transparent" }}
          >
            <div style={{ width: 14, height: 14, borderRadius: 3, border: "1.5px solid var(--text-4)", flexShrink: 0, marginRight: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {["COMPLETED", "APPROVED"].includes(task.status) && <Check size={10} color="var(--text-3)" />}
            </div>
            
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: prioColor, flexShrink: 0, marginRight: 8 }} />
            
            <span style={{ fontSize: 13, color: "var(--text-1)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 400 }}>
              {task.title}
            </span>
            
            {task.area && (
              <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, marginLeft: 8, flexShrink: 0, background: areaBg, color: areaColor }}>
                {task.area.name}
              </span>
            )}
            
            <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, marginLeft: 6, flexShrink: 0, background: statBg, color: statColor }}>
              {statLabel}
            </span>

            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, paddingLeft: 12 }}>
              {task.assignedTo ? (
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: areaColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700 }}>
                  {task.assignedTo.name.charAt(0)}
                </div>
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1px dashed var(--text-4)" }} />
              )}
              
              {dateText && (
                <span style={{ fontSize: 11, color: dateColor, fontWeight: dateColor === "var(--text-3)" ? 400 : 500, width: 65, textAlign: "right" }}>
                  {dateText}
                </span>
              )}
              
              {(task._count?.comments > 0) && (
                <div style={{ display: "flex", alignItems: "center", gap: 3, color: "var(--text-3)", fontSize: 11, width: 30, justifyContent: "flex-end" }}>
                  <MessageSquare size={11} /> {task._count.comments}
                </div>
              )}
            </div>
          </Link>
        );
      })}
      {tasks.length > limit && (
        <Link href="/tasks" style={{ display: "block", textAlign: "center", padding: 10, fontSize: 12, color: "var(--text-3)", textDecoration: "none" }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}>
          Ver todas las tareas →
        </Link>
      )}
    </div>
  );
}

function AreaHealthTable({ areas }: { areas: any[] }) {
  if (areas.length === 0) return null;
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 54px 62px 60px", padding: "8px 14px", background: "var(--surface-alt)", borderBottom: "1px solid var(--border-light)", fontSize: 10.5, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
        <div>Área</div>
        <div>Progreso</div>
        <div style={{ textAlign: "center" }}>Total</div>
        <div style={{ textAlign: "center" }}>Listas</div>
        <div style={{ textAlign: "center" }}>Vencidas</div>
      </div>
      
      {/* Rows */}
      {areas.map((a, i) => {
        const rate = a.completionRate ?? 0;
        const total = a.taskCount ?? 0;
        const completed = a.completedCount ?? 0;
        const overdue = a.overdueCount ?? 0;
        const isBad = overdue > 0;
        
        return (
          <div key={a.areaId} style={{ display: "grid", gridTemplateColumns: "180px 1fr 54px 62px 60px", alignItems: "center", padding: "10px 14px", borderBottom: i < areas.length - 1 ? "1px solid var(--border-light)" : "none", background: isBad ? "#fef2f2" : "transparent", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={e => { if(!isBad) e.currentTarget.style.background = "var(--surface-alt)" }} onMouseLeave={e => { if(!isBad) e.currentTarget.style.background = "transparent" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.color }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{a.name}</span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1, height: 4, background: "#f0ede7", borderRadius: 2, marginRight: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", background: a.color, width: `${Math.min(rate, 100)}%` }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: a.color, whiteSpace: "nowrap", width: 28 }}>{rate}%</span>
            </div>
            
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", textAlign: "center" }}>{total}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ok)", textAlign: "center" }}>{completed}</div>
            <div style={{ fontSize: 12, fontWeight: overdue > 0 ? 600 : 400, color: overdue > 0 ? "var(--bad)" : "var(--text-3)", textAlign: "center" }}>{overdue}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dashboards ───────────────────────────────────────

function SuperAdminDashboard() {
  const { data: overdueData } = trpc.reports.overdueByArea.useQuery();
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: tasksData } = trpc.tasks.list.useQuery({ page: 1, limit: 10 });

  const tasks = tasksData?.tasks ?? [];
  const areas = overdueData ?? [];
  const rate = completionData?.completionRate ?? 0;
  
  const compColor = rate < 40 ? "var(--bad)" : rate <= 70 ? "var(--warn)" : "var(--ok)";
  const overColor = (completionData?.overdue ?? 0) > 0 ? "var(--bad)" : "var(--text-3)";
  const overLabel = (completionData?.overdue ?? 0) > 0 ? "var(--bad)" : "var(--text-3)";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SectionLabel>Métricas Globales — Abril 2026</SectionLabel>
      <StatStrip stats={[
        { label: "Total tareas", value: completionData?.total ?? 0, icon: Grid, color: "var(--text-1)" },
        { label: "Completadas", value: completionData?.completed ?? 0, icon: Check, color: (completionData?.completed ?? 0) > 0 ? "var(--ok)" : "var(--text-3)" },
        { label: "Vencidas", value: completionData?.overdue ?? 0, icon: AlertCircle, color: overColor, iconColor: overLabel },
        { label: "Tasa global", value: `${Math.min(rate, 100)}%`, icon: TrendingUp, color: compColor }
      ]} />

      <AreaHealthTable areas={areas} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24, marginBottom: 8 }}>
        <SectionLabel>Actividad del proyecto</SectionLabel>
        <div style={{ display: "flex", gap: 4 }}>
          {["Todo", "Pendientes", "Vencidas"].map((f, i) => (
            <button key={f} style={{
              fontSize: 11, padding: "3px 9px", borderRadius: 4, cursor: "pointer",
              border: i === 0 ? "1px solid var(--border)" : "1px solid transparent",
              background: i === 0 ? "var(--surface)" : "transparent",
              color: i === 0 ? "var(--text-1)" : "var(--text-3)",
              fontWeight: i === 0 ? 500 : 400,
              transition: "all .1s"
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <CompactTaskList tasks={tasks} limit={10} />
    </div>
  );
}

function AdminAreaDashboard() {
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: tasksData } = trpc.tasks.list.useQuery({ page: 1, limit: 10 });

  const tasks = tasksData?.tasks ?? [];
  const rate = completionData?.completionRate ?? 0;
  
  const compColor = rate < 40 ? "var(--bad)" : rate <= 70 ? "var(--warn)" : "var(--ok)";
  const overColor = (completionData?.overdue ?? 0) > 0 ? "var(--bad)" : "var(--text-3)";
  const overLabel = (completionData?.overdue ?? 0) > 0 ? "var(--bad)" : "var(--text-3)";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SectionLabel>Visión del Área</SectionLabel>
      <StatStrip stats={[
        { label: "Total tareas", value: completionData?.total ?? 0, icon: Grid, color: "var(--text-1)" },
        { label: "Completadas", value: completionData?.completed ?? 0, icon: Check, color: (completionData?.completed ?? 0) > 0 ? "var(--ok)" : "var(--text-3)" },
        { label: "Vencidas", value: completionData?.overdue ?? 0, icon: AlertCircle, color: overColor, iconColor: overLabel },
        { label: "Tasa completitud", value: `${Math.min(rate, 100)}%`, icon: TrendingUp, color: compColor }
      ]} />

      <SectionLabel>Tareas recientes</SectionLabel>
      <CompactTaskList tasks={tasks} limit={10} />
    </div>
  );
}

function SupervisorDashboard() {
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  const { data: tasksData } = trpc.tasks.list.useQuery({ page: 1, limit: 15 });

  const tasks = tasksData?.tasks ?? [];
  const awaitingReview = tasks.filter(t => t.status === "AWAITING_REVIEW");
  
  const rate = completionData?.completionRate ?? 0;
  const compColor = rate < 40 ? "var(--bad)" : rate <= 70 ? "var(--warn)" : "var(--ok)";
  const overColor = (completionData?.overdue ?? 0) > 0 ? "var(--bad)" : "var(--text-3)";
  const apvColor = awaitingReview.length > 0 ? "var(--accent)" : "var(--text-3)";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SectionLabel>Métricas operativas</SectionLabel>
      <StatStrip stats={[
        { label: "Aprob. pendientes", value: awaitingReview.length, icon: Clock, color: apvColor },
        { label: "Vencidas", value: completionData?.overdue ?? 0, icon: AlertCircle, color: overColor, iconColor: overColor },
        { label: "Completadas", value: completionData?.completed ?? 0, icon: Check, color: "var(--text-1)" },
        { label: "Tasa éxito", value: `${Math.min(rate, 100)}%`, icon: TrendingUp, color: compColor }
      ]} />

      {awaitingReview.length > 0 && (
        <>
          <SectionLabel>Requieren revisión</SectionLabel>
          <CompactTaskList tasks={awaitingReview} limit={5} />
        </>
      )}

      <SectionLabel>Actividad de equipo</SectionLabel>
      <CompactTaskList tasks={tasks.filter(t => t.status !== "AWAITING_REVIEW")} limit={10} />
    </div>
  );
}

function AuditorDashboard() {
  const { data: overdueData } = trpc.reports.overdueByArea.useQuery();
  const { data: completionData } = trpc.reports.taskCompletionRate.useQuery({});
  
  const areas = overdueData ?? [];
  const rate = completionData?.completionRate ?? 0;
  const compColor = rate < 40 ? "var(--bad)" : rate <= 70 ? "var(--warn)" : "var(--ok)";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SectionLabel>Resumen de auditoría</SectionLabel>
      <StatStrip stats={[
        { label: "Volumen", value: completionData?.total ?? 0, icon: Grid, color: "var(--text-1)" },
        { label: "Riesgos (Vencidas)", value: completionData?.overdue ?? 0, icon: AlertCircle, color: (completionData?.overdue ?? 0) > 0 ? "var(--bad)" : "var(--text-3)" },
        { label: "Cumplimiento", value: `${Math.min(rate, 100)}%`, icon: TrendingUp, color: compColor }
      ]} />

      <AreaHealthTable areas={areas} />
    </div>
  );
}

function OperarioDashboard() {
  const { data: tasksData, isLoading } = trpc.tasks.list.useQuery({ page: 1, limit: 15 });
  const tasks = tasksData?.tasks ?? [];
  const myTasks = tasks.filter(t => !["COMPLETED", "CANCELLED"].includes(t.status));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <SectionLabel>Mi trabajo</SectionLabel>
      <StatStrip stats={[
        { label: "Pendientes", value: myTasks.length, icon: Square, color: "var(--text-1)" },
        { label: "Para hoy", value: myTasks.filter(t => {
            if(!t.dueDate) return false;
            const d = new Date(t.dueDate);
            const today = new Date();
            return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
          }).length, icon: Clock, color: "var(--warn)" 
        },
        { label: "Aprobaciones", value: tasks.filter(t => t.status === "AWAITING_REVIEW").length, icon: CheckSquare, color: "var(--accent)" }
      ]} />

      <SectionLabel>Mis tareas activas</SectionLabel>
      {isLoading ? <div className="skel" style={{ height: 200 }} /> : <CompactTaskList tasks={myTasks} limit={10} />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="skel" style={{ height: 20, width: 100, marginBottom: 8, marginTop: 24 }} />
      <div className="skel" style={{ height: 80, width: "100%", marginBottom: 32 }} />
      <div className="skel" style={{ height: 20, width: 150, marginBottom: 8 }} />
      <div className="skel" style={{ height: 300, width: "100%" }} />
    </div>
  );
}
