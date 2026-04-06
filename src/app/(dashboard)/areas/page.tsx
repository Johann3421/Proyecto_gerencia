"use client";

import { trpc } from "@/lib/trpc-client";
import { useSession } from "next-auth/react";
import {
  Building2,
  Cpu,
  TrendingUp,
  Package,
  Factory,
  type LucideIcon,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useUIStore } from "@/store/ui-store";

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

export default function AreasPage() {
  const { data: session } = useSession();
  const { data: kpis, isLoading } = trpc.reports.areaKPIs.useQuery({});
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div>
        <div className="skel" style={{ height: 40, width: 250, marginBottom: 24 }} />
        <div className="skel" style={{ height: 300, width: "100%" }} />
      </div>
    );
  }

  const areas = kpis ?? [];
  const filteredAreas = areas.filter(a => a.area?.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ position: "relative", width: 250 }}>
          <Search size={14} color="var(--text-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            placeholder="Buscar área..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: "100%", height: 32, paddingLeft: 30, paddingRight: 10,
              fontSize: 13, background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--r)", outline: "none", color: "var(--text-1)"
            }} 
          />
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 90px 80px 80px", padding: "8px 14px", background: "var(--surface-alt)", borderBottom: "1px solid var(--border-light)", fontSize: 10.5, fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.3px", textTransform: "uppercase" }}>
          <div>Área</div>
          <div>Progreso del mes</div>
          <div style={{ textAlign: "center" }}>Total</div>
          <div style={{ textAlign: "center" }}>Listas</div>
          <div style={{ textAlign: "center" }}>Vencidas</div>
        </div>
        
        {/* Rows */}
        {filteredAreas.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            No se encontraron áreas.
          </div>
        ) : filteredAreas.map((kpi, i) => {
          const rate = kpi.totalTasks > 0 ? Math.min(Math.round((kpi.completed / kpi.totalTasks) * 100), 100) : 0;
          const total = kpi.totalTasks;
          const completed = kpi.completed;
          const overdue = kpi.overdue;
          
          const isBad = overdue > 0;
          const areaColor = kpi.area?.color ?? "#818cf8";
          
          return (
            <Link key={kpi.id} href={`/areas/${kpi.areaId}`} style={{ display: "grid", gridTemplateColumns: "180px 1fr 90px 80px 80px", alignItems: "center", padding: "10px 14px", borderBottom: i < filteredAreas.length - 1 ? "1px solid var(--border-light)" : "none", background: isBad ? "#fef2f2" : "transparent", textDecoration: "none", transition: "background 0.1s" }} onMouseEnter={e => { if(!isBad) e.currentTarget.style.background = "var(--surface-alt)" }} onMouseLeave={e => { if(!isBad) e.currentTarget.style.background = "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: areaColor }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)" }}>{kpi.area?.name}</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", paddingRight: 20 }}>
                <div style={{ flex: 1, height: 4, background: "#f0ede7", borderRadius: 2, marginRight: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", background: areaColor, width: `${rate}%` }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: areaColor, whiteSpace: "nowrap", width: 28 }}>{rate}%</span>
              </div>
              
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)", textAlign: "center" }}>{total}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ok)", textAlign: "center" }}>{completed}</div>
              <div style={{ fontSize: 12, fontWeight: overdue > 0 ? 600 : 400, color: overdue > 0 ? "var(--bad)" : "var(--text-3)", textAlign: "center" }}>{overdue}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
