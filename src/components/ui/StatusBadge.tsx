"use client";

import type { TaskStatus } from "@prisma/client";

const STATUS_STYLES: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  PENDING:         { label: "Pendiente",     color: "var(--status-pending)",   bg: "rgba(144,144,168,0.10)" },
  IN_PROGRESS:     { label: "En progreso",   color: "var(--status-progress)",  bg: "rgba(96,165,250,0.10)"  },
  BLOCKED:         { label: "Bloqueado",     color: "var(--status-blocked)",   bg: "rgba(248,113,113,0.10)" },
  AWAITING_REVIEW: { label: "En revisión",   color: "var(--status-review)",    bg: "rgba(251,191,36,0.10)"  },
  APPROVED:        { label: "Aprobado",      color: "var(--status-approved)",  bg: "rgba(74,222,128,0.10)"  },
  COMPLETED:       { label: "Completado",    color: "var(--status-completed)", bg: "rgba(74,222,128,0.10)"  },
  CANCELLED:       { label: "Cancelado",     color: "var(--status-cancelled)", bg: "rgba(58,58,80,0.50)"    },
  REJECTED:        { label: "Rechazado",     color: "var(--status-rejected)",  bg: "rgba(248,113,113,0.10)" },
};

interface StatusBadgeProps {
  status: TaskStatus;
  size?: "sm" | "md";
  showDot?: boolean;
}

export function StatusBadge({ status, size = "sm", showDot = true }: StatusBadgeProps) {
  const config = STATUS_STYLES[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: size === "sm" ? "3px 10px" : "4px 12px",
        borderRadius: "100px",
        fontSize: size === "sm" ? "11px" : "12px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      {showDot && (
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: config.color,
            flexShrink: 0,
          }}
        />
      )}
      {config.label}
    </span>
  );
}

export { STATUS_STYLES };
