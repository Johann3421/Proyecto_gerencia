"use client";

import { trpc } from "@/lib/trpc-client";
import { useSession } from "next-auth/react";
import {
  Building2,
  Cpu,
  TrendingUp,
  Package,
  Factory,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

// ─── BUG 1 FIX: Dynamic icon lookup ──────────────────
// The DB stores icon names as strings (e.g. "building-2").
// This map resolves them to actual Lucide components.
const AREA_ICONS: Record<string, LucideIcon> = {
  "building-2": Building2,
  "cpu": Cpu,
  "trending-up": TrendingUp,
  "package": Package,
  "factory": Factory,
};

function getAreaIcon(iconName: string | undefined): LucideIcon {
  if (!iconName) return Building2;
  return AREA_ICONS[iconName] ?? Building2;
}

// Format period "2026-04" → "Abr 2026"
function formatPeriod(period: string): string {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const [year, month] = period.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return period;
  return `${months[monthIndex]} ${year}`;
}

export default function AreasPage() {
  const { data: session } = useSession();
  const { data: kpis, isLoading } = trpc.reports.areaKPIs.useQuery({});

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="nexus-skeleton" style={{ width: 120, height: 24, marginBottom: 8 }} />
          <div className="nexus-skeleton" style={{ width: 260, height: 16 }} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="nexus-skeleton" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>
          Áreas
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 2 }}>
          Organigrama y estado operacional por área
        </p>
      </div>

      {/* Area grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis?.map((kpi) => {
          // BUG 2 FIX: Clamp completion rate to 100% max
          const completionRate = kpi.totalTasks > 0
            ? Math.min(Math.round((kpi.completed / kpi.totalTasks) * 100), 100)
            : 0;

          const areaColor = kpi.area?.color ?? "#818cf8";
          const IconComponent = getAreaIcon(kpi.area?.icon);

          return (
            <Link
              key={kpi.id}
              href={`/areas/${kpi.areaId}`}
              className="group block"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${areaColor}4D`;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border-subtle)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {/* Area header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "var(--radius-md)",
                      backgroundColor: `${areaColor}1F`,
                    }}
                  >
                    <IconComponent size={18} style={{ color: areaColor }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
                      {kpi.area?.name ?? "Área"}
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {formatPeriod(kpi.period)}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  style={{ color: "var(--text-muted)", transition: "all 0.2s ease" }}
                  className="group-hover:translate-x-1"
                />
              </div>

              {/* Completion bar */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Completado</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: areaColor }}>
                    {completionRate}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--bg-elevated)",
                    borderRadius: "100px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(completionRate, 100)}%`,
                      background: `linear-gradient(90deg, ${areaColor}99, ${areaColor})`,
                      borderRadius: "100px",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div
                className="grid grid-cols-3 gap-2"
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 8px",
                }}
              >
                <div className="text-center">
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>
                    {kpi.totalTasks}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--success)" }}>
                    {kpi.completed}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Completadas</div>
                </div>
                <div className="text-center">
                  <div style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: kpi.overdue > 0 ? "var(--danger)" : "var(--text-muted)",
                  }}>
                    {kpi.overdue}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Vencidas</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {(!kpis || kpis.length === 0) && (
        <div
          className="flex flex-col items-center justify-center"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: 48,
          }}
        >
          <Building2 size={48} style={{ color: "var(--text-muted)", marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
            No hay áreas configuradas
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            Contacta al administrador para agregar áreas al sistema.
          </p>
        </div>
      )}
    </div>
  );
}
