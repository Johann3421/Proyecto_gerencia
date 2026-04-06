"use client";

import { trpc } from "@/lib/trpc-client";
import { Check, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "@/lib/utils";

// Make sure to reuse the compact list for these as well
function CompactTaskList({ tasks }: { tasks: any[] }) {
  if (tasks.length === 0) return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: 32, textAlign: "center", fontSize: 14, color: "var(--text-3)" }}>
      No hay tareas pendientes de aprobación.
    </div>
  );

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

        const statBg = "#fef9c3", statColor = "#854d0e", statLabel = "En revisión";

        const dateDue = task.dueDate ? new Date(task.dueDate) : null;
        let dateColor = "var(--text-3)", dateText = "";
        if (dateDue) {
          const relativeMs = dateDue.getTime() - new Date().getTime();
          const relativeDays = Math.ceil(relativeMs / (1000 * 60 * 60 * 24));
          
          if (relativeDays < 0) {
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
            <div style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid var(--text-4)", flexShrink: 0, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center" }} />
            
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

export default function ApprovalsPage() {
  const { data: tasks, isLoading } = trpc.tasks.list.useQuery({
    status: "AWAITING_REVIEW",
    limit: 50,
  });

  const pendingTasks = tasks?.tasks ?? [];

  if (isLoading) {
    return <div className="skel" style={{ height: 400, width: "100%" }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ 
        fontSize: 11, fontWeight: 500, color: "var(--text-3)",
        letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 8, marginTop: 24 
      }}>
        Tareas pendientes ({pendingTasks.length})
      </div>
      
      <CompactTaskList tasks={pendingTasks} />
    </div>
  );
}
