"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc-client";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  Check,
  MessageSquare,
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
    return <div className="skel" style={{ height: 400, width: "100%" }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, marginTop: 24 }}>
        <Link
          href="/areas"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 36, height: 36, borderRadius: "50%", background: "var(--surface)",
            border: "1px solid var(--border)", color: "var(--text-2)", transition: "all 0.1s"
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-alt)"; e.currentTarget.style.color = "var(--text-1)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.color = "var(--text-2)"; }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {areaKpi && (
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 44, height: 44, borderRadius: 10, fontSize: 20,
                background: `${areaKpi.area?.color ?? "#6366f1"}20`,
                color: areaKpi.area?.color ?? "#6366f1", border: `1px solid ${areaKpi.area?.color ?? "#6366f1"}30`
              }}
            >
              {areaKpi.area?.icon ?? "🏢"}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", margin: "0 0 2px 0", letterSpacing: "-0.3px" }}>
              {areaKpi?.area?.name ?? "Área"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)", margin: 0 }}>
              {tasks?.pagination?.total ?? 0} tareas registradas
            </p>
          </div>
        </div>
      </div>

      {/* KPI strips */}
      {areaKpi && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--r)", display: "flex", overflow: "hidden", marginBottom: 24
        }}>
          <div style={{ flex: 1, padding: "20px 24px", borderRight: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <BarChart3 size={16} color="var(--accent)" /> Total tareas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--text-1)" }}>
              {areaKpi.totalTasks}
            </div>
          </div>
          <div style={{ flex: 1, padding: "20px 24px", borderRight: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <CheckCircle2 size={16} color="var(--ok)" /> Completadas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--ok)" }}>
              {areaKpi.completed}
            </div>
          </div>
          <div style={{ flex: 1, padding: "20px 24px", borderRight: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={16} color="var(--warn)" /> Métrica H.
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--warn)" }}>
              {areaKpi.avgHours ? `${Math.round(areaKpi.avgHours)}h` : "—"}
            </div>
          </div>
          <div style={{ flex: 1, padding: "20px 24px" }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={16} color="var(--bad)" /> Vencidas
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--bad)" }}>
              {areaKpi.overdue}
            </div>
          </div>
        </div>
      )}

      {/* Task list compact view */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 16px 0" }}>
          Tareas del área
        </h2>
        
        {tasks?.tasks && tasks.tasks.length > 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
            {tasks.tasks.map((task) => {
              const isCritical = task.priority === "CRITICAL";
              const prioColor = isCritical ? "var(--bad)" : task.priority === "HIGH" ? "var(--warn)" : task.priority === "MEDIUM" ? "var(--accent)" : "var(--text-4)";
              const areaColor = task.area?.color ?? "#818cf8";
              
              const highlighted = ["AWAITING_REVIEW", "IN_PROGRESS"].includes(task.status) && isCritical;
              
              const dateText = task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : "";
              const isOverdue = task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" : false;
              const dateColor = isOverdue ? "var(--bad)" : "var(--text-3)";

              const statBg = task.status === "COMPLETED" ? "#f0fdf4" : task.status === "AWAITING_REVIEW" ? "#fffbeb" : "var(--surface-alt)";
              const statColor = task.status === "COMPLETED" ? "var(--ok)" : task.status === "AWAITING_REVIEW" ? "var(--warn)" : "var(--text-2)";
              const statLabel = task.status === "AWAITING_REVIEW" ? "En revisión" : task.status === "COMPLETED" ? "Completado" : task.status === "IN_PROGRESS" ? "En progreso" : "Pendiente";

              return (
                <Link key={task.id} href={`/tasks/${task.id}`} style={{
                  display: "flex", alignItems: "center", padding: highlighted ? "0 20px 0 16px" : "0 20px",
                  minHeight: 52, borderBottom: "1px solid var(--border-light)", textDecoration: "none",
                  background: highlighted ? "#fffafa" : "transparent",
                  borderLeft: highlighted ? "4px solid var(--bad)" : "none",
                  transition: "background 0.1s"
                }}
                onMouseEnter={e => { if(!highlighted) e.currentTarget.style.background = "var(--surface-alt)" }}
                onMouseLeave={e => { if(!highlighted) e.currentTarget.style.background = "transparent" }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid var(--text-4)", flexShrink: 0, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {["COMPLETED", "APPROVED"].includes(task.status) && <Check size={12} color="var(--text-3)" />}
                  </div>
                  
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: prioColor, flexShrink: 0, marginRight: 10 }} />
                  
                  <span style={{ fontSize: 14, color: "var(--text-1)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                    {task.title}
                  </span>
                  
                  <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, marginLeft: 8, flexShrink: 0, background: statBg, color: statColor }}>
                    {statLabel}
                  </span>

                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12, paddingLeft: 16 }}>
                    {task.assignedTo ? (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: areaColor, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>
                        {task.assignedTo.name.charAt(0)}
                      </div>
                    ) : (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1px dashed var(--text-4)" }} />
                    )}
                    
                    {dateText && (
                      <span style={{ fontSize: 12, color: dateColor, fontWeight: dateColor === "var(--text-3)" ? 400 : 500, width: 70, textAlign: "right" }}>
                        {dateText}
                      </span>
                    )}
                    
                    {(task._count?.comments > 0) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-3)", fontSize: 12, width: 34, justifyContent: "flex-end" }}>
                        <MessageSquare size={13} /> {task._count.comments}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 64, textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text-3)", fontSize: 14 }}>
            No hay tareas registradas en esta área.
          </div>
        )}
      </div>
    </div>
  );
}
