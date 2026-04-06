"use client";

import type { Priority } from "@prisma/client";

const PRIORITY_STYLES: Record<Priority, {
  label: string;
  color: string;
  bg: string;
  dot: string;
  pulse?: boolean;
}> = {
  LOW:      { label: "Baja",    color: "#6b7280", bg: "rgba(107,114,128,0.10)", dot: "#6b7280" },
  MEDIUM:   { label: "Media",   color: "#60a5fa", bg: "rgba(96,165,250,0.10)",  dot: "#60a5fa" },
  HIGH:     { label: "Alta",    color: "#fbbf24", bg: "rgba(251,191,36,0.10)",  dot: "#fbbf24" },
  CRITICAL: { label: "Crítica", color: "#f87171", bg: "rgba(248,113,113,0.12)", dot: "#f87171", pulse: true },
};

interface PriorityBadgeProps {
  priority: Priority;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, size = "sm" }: PriorityBadgeProps) {
  const config = PRIORITY_STYLES[priority];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: size === "sm" ? "3px 8px" : "4px 10px",
        borderRadius: "100px",
        fontSize: size === "sm" ? "10px" : "11px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        color: config.color,
        backgroundColor: config.bg,
      }}
    >
      <span
        className={config.pulse ? "priority-critical-pulse" : undefined}
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: config.dot,
          flexShrink: 0,
        }}
      />
      {config.label}
    </span>
  );
}

export { PRIORITY_STYLES };
