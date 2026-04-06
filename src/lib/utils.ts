import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMs < 0) {
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours);
    if (absDays > 0) return `en ${absDays} día${absDays > 1 ? "s" : ""}`;
    if (absHours > 0) return `en ${absHours} hora${absHours > 1 ? "s" : ""}`;
    return "pronto";
  }

  if (diffMins < 1) return "ahora mismo";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export function formatDueDate(date: Date | string | null): { text: string; isOverdue: boolean; isUrgent: boolean } {
  if (!date) return { text: "Sin fecha límite", isOverdue: false, isUrgent: false };

  const now = new Date();
  const d = new Date(date);
  const diffMs = d.getTime() - now.getTime();
  const diffHours = diffMs / 3600000;
  const diffDays = diffMs / 86400000;

  if (diffMs < 0) {
    const absDays = Math.abs(Math.floor(diffDays));
    return {
      text: `¡Vencida hace ${absDays} día${absDays !== 1 ? "s" : ""}!`,
      isOverdue: true,
      isUrgent: true,
    };
  }

  if (diffHours < 2) return { text: "Vence en menos de 2 horas", isOverdue: false, isUrgent: true };
  if (diffDays < 1) return { text: "Vence hoy", isOverdue: false, isUrgent: true };
  if (diffDays < 2) return { text: "Vence mañana", isOverdue: false, isUrgent: false };
  if (diffDays < 7) return { text: `Vence en ${Math.ceil(diffDays)} días`, isOverdue: false, isUrgent: false };

  return {
    text: `Vence el ${d.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}`,
    isOverdue: false,
    isUrgent: false,
  };
}
