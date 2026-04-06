"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";

import {
  Search,
  Check,
  MessageSquare,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/types";
import type { TaskStatus, Priority, RoleType } from "@prisma/client";

const STATUS_OPTIONS: TaskStatus[] = [
  "PENDING",
  "IN_PROGRESS",
  "BLOCKED",
  "AWAITING_REVIEW",
  "COMPLETED",
  "CANCELLED",
];

const PRIORITY_OPTIONS: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Same component as dashboard, extracted for reuse here since it's the requested style
function CompactTaskList({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) return null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", overflow: "hidden" }}>
      {tasks.map((task) => {
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
            
            {task.area && (
              <span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 4, marginLeft: 10, flexShrink: 0, background: areaBg, color: areaColor }}>
                {task.area.name}
              </span>
            )}
            
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
  );
}

export default function TasksPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);



  const { data, isLoading } = trpc.tasks.list.useQuery({
    search: search || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    page,
    limit: 20,
  });

  const tasks = data?.tasks ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const activeFilters = (statusFilter ? 1 : 0) + (priorityFilter ? 1 : 0) + (search ? 1 : 0);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setPage(1);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Search & Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} color="var(--text-3)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar tareas..."
            style={{
              width: "100%", height: 32, paddingLeft: 30, paddingRight: 10,
              fontSize: 13, background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--r)", outline: "none", color: "var(--text-1)"
            }}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px",
            borderRadius: "var(--r)", fontSize: 13, cursor: "pointer",
            border: showFilters || activeFilters > 0 ? "1px solid var(--accent)" : "1px solid var(--border)",
            background: showFilters || activeFilters > 0 ? "var(--sidebar-active-bg)" : "var(--surface)",
            color: showFilters || activeFilters > 0 ? "var(--accent)" : "var(--text-2)",
          }}
        >
          <Filter size={14} /> Filtros {activeFilters > 0 && `(${activeFilters})`}
        </button>

        {showFilters && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as TaskStatus | ""); setPage(1); }}
              style={{
                height: 32, padding: "0 24px 0 10px", background: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text-1)",
                fontSize: 13, outline: "none", appearance: "none"
              }}
            >
              <option value="">Todos los estados</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value as Priority | ""); setPage(1); }}
              style={{
                height: 32, padding: "0 24px 0 10px", background: "var(--surface)",
                border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text-1)",
                fontSize: 13, outline: "none", appearance: "none"
              }}
            >
              <option value="">Todas las prioridades</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p]?.label ?? p}</option>
              ))}
            </select>

            {activeFilters > 0 && (
              <button 
                onClick={clearFilters}
                style={{ fontSize: 12, color: "var(--bad)", background: "transparent", border: "none", cursor: "pointer", padding: "0 8px" }}
              >
                Limpiar
              </button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="skel" style={{ height: 400, width: "100%" }} />
      ) : tasks.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", color: "var(--text-3)", fontSize: 14 }}>
          No se encontraron tareas con estos filtros.
        </div>
      ) : (
        <>
          <CompactTaskList tasks={tasks} />

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 24, fontSize: 13 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "4px 8px", cursor: page === 1 ? "default" : "pointer", opacity: page === 1 ? 0.4 : 1, background: "transparent", border: "none", color: "var(--text-2)" }}
              >
                Anterior
              </button>
              <span style={{ color: "var(--text-3)" }}>{page} de {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: "4px 8px", cursor: page === totalPages ? "default" : "pointer", opacity: page === totalPages ? 0.4 : 1, background: "transparent", border: "none", color: "var(--text-2)" }}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
