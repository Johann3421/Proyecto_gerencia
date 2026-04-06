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
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, marginTop: 24 }}>
        <div style={{ 
          fontSize: 13, fontWeight: 600, color: "var(--text-2)",
          letterSpacing: "0.2px", textTransform: "uppercase" 
        }}>
          Reporte General
        </div>
        
        {/* Date range selector */}
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
          {(["week", "month", "quarter"] as const).map((r, i) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 500,
                background: dateRange === r ? "var(--surface-alt)" : "transparent",
                color: dateRange === r ? "var(--accent)" : "var(--text-3)",
                border: "none", borderLeft: i > 0 ? "1px solid var(--border-light)" : "none",
                transition: "all 0.1s"
              }}
            >
              {r === "week" ? "Semana" : r === "month" ? "Mes" : "Trimestre"}
            </button>
          ))}
        </div>
      </div>

      {/* Global KPIs via StatStrip layout equivalent */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r)", display: "flex", overflow: "hidden", marginBottom: 24
      }}>
        <div style={{ flex: 1, padding: "20px 24px", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <BarChart3 size={16} color="var(--accent)" /> Total tareas
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--text-1)" }}>
            {totalTasks}
          </div>
        </div>
        <div style={{ flex: 1, padding: "20px 24px", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={16} color="var(--ok)" /> Tasa completado
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--ok)" }}>
            {globalRate}%
          </div>
        </div>
        <div style={{ flex: 1, padding: "20px 24px", borderRight: "1px solid var(--border-light)" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={16} color="var(--bad)" /> Tareas vencidas
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--bad)" }}>
            {totalOverdue}
          </div>
        </div>
        <div style={{ flex: 1, padding: "20px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={16} color="var(--warn)" /> En progreso
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1, color: "var(--warn)" }}>
            {completionRate?.inProgress ?? "—"}
          </div>
        </div>
      </div>

      {/* Area comparison */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r)", padding: 24, marginBottom: 24
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 20px 0" }}>
          Rendimiento General por Área
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {kpis?.map((area) => {
            const rate = area.totalTasks > 0 ? Math.round((area.completed / area.totalTasks) * 100) : 0;
            const barColor = rate >= 80 ? "var(--ok)" : rate >= 50 ? "var(--warn)" : "var(--bad)";
            return (
              <div key={area.id}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{area.area?.icon ?? "🏢"}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)" }}>
                      {area.area?.name}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--text-3)" }}>
                    <span>{area.completed}/{area.totalTasks}</span>
                    <span style={{ fontWeight: 600, color: "var(--text-1)" }}>{rate}%</span>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "var(--surface-alt)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${rate}%`, background: barColor, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Overdue by area */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} color="var(--bad)" /> Vencidas por Área
          </h2>
          {overdue && overdue.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {overdue.map((item) => (
                <div key={item.areaId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface-alt)", borderRadius: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{item.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--bad)" }}>{item.overdueCount}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: 20 }}>Sin tareas vencidas</p>
          )}
        </div>

        {/* Top productivity */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={16} color="var(--ok)" /> Top Productividad
          </h2>
          {productivity && productivity.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {productivity.map((user, i) => (
                <div key={user.userId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--surface-alt)", borderRadius: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--text-1)" }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{user.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{user.completedTasks}</span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 4 }}>completadas</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-3)", textAlign: "center", padding: 20 }}>Sin datos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
}
