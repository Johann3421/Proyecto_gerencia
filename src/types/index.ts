import type { RoleType, TaskStatus, Priority, NotificationType } from "@prisma/client";

export type { RoleType, TaskStatus, Priority, NotificationType };

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | Date | null;
  completedAt: string | Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  areaId: string;
  departmentId: string | null;
  assignedToId: string | null;
  createdById: string;
  parentTaskId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  assignedTo: { id: string; name: string; avatar: string | null; role: RoleType } | null;
  createdBy: { id: string; name: string };
  area: { id: string; name: string; color: string; icon: string };
  department: { id: string; name: string } | null;
  tags: { id: string; name: string; color: string }[];
  _count: { subtasks: number; comments: number; evidence: number };
}

export interface UserBasic {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  avatar: string | null;
  areaId: string | null;
  departmentId: string | null;
}

export interface AreaBasic {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bgColor: string; icon: string }> = {
  PENDING: { label: "Pendiente", color: "text-gray-600", bgColor: "bg-gray-100", icon: "circle" },
  IN_PROGRESS: { label: "En progreso", color: "text-blue-600", bgColor: "bg-blue-100", icon: "play-circle" },
  BLOCKED: { label: "Bloqueado", color: "text-red-600", bgColor: "bg-red-100", icon: "x-circle" },
  AWAITING_REVIEW: { label: "En revisión", color: "text-amber-600", bgColor: "bg-amber-100", icon: "clock" },
  APPROVED: { label: "Aprobado", color: "text-green-600", bgColor: "bg-green-100", icon: "check-circle" },
  REJECTED: { label: "Rechazado", color: "text-red-600", bgColor: "bg-red-100", icon: "x-circle" },
  COMPLETED: { label: "Completado", color: "text-emerald-600", bgColor: "bg-emerald-100", icon: "check-circle-2" },
  CANCELLED: { label: "Cancelado", color: "text-gray-400", bgColor: "bg-gray-50", icon: "ban" },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bgColor: string; dotColor: string }> = {
  LOW: { label: "Baja", color: "text-gray-500", bgColor: "bg-gray-100", dotColor: "bg-gray-400" },
  MEDIUM: { label: "Media", color: "text-blue-600", bgColor: "bg-blue-100", dotColor: "bg-blue-500" },
  HIGH: { label: "Alta", color: "text-amber-600", bgColor: "bg-amber-100", dotColor: "bg-amber-500" },
  CRITICAL: { label: "Crítica", color: "text-red-600", bgColor: "bg-red-100", dotColor: "bg-red-500" },
};

export const ROLE_LABELS: Record<RoleType, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_AREA: "Admin de Área",
  SUPERVISOR: "Supervisor",
  OPERARIO: "Operario",
  AUDITOR: "Auditor",
};

export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  TASK_ASSIGNED: "user-plus",
  TASK_APPROVED: "check-circle",
  TASK_REJECTED: "x-circle",
  TASK_DUE_SOON: "clock",
  TASK_OVERDUE: "alert-triangle",
  APPROVAL_REQUESTED: "shield-check",
  COMMENT_MENTION: "at-sign",
  STOCK_ALERT: "package-x",
};
