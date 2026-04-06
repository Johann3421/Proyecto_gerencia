import { z } from "zod";
import { Priority, TaskStatus, RoleType, ApprovalStatus, NotificationType } from "@prisma/client";

// ─── Auth ────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

// ─── Tasks ───────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(200),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  areaId: z.string().cuid(),
  departmentId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().positive().optional(),
  parentTaskId: z.string().cuid().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const updateTaskStatusSchema = z.object({
  taskId: z.string().cuid(),
  status: z.nativeEnum(TaskStatus),
});

export const assignTaskSchema = z.object({
  taskId: z.string().cuid(),
  assignedToId: z.string().cuid(),
});

export const taskListFilterSchema = z.object({
  areaId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  assignedToId: z.string().cuid().optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  search: z.string().max(200).optional(),
  parentTaskId: z.string().cuid().nullish(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export const addCommentSchema = z.object({
  taskId: z.string().cuid(),
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string().cuid()).optional(),
});

export const uploadEvidenceSchema = z.object({
  taskId: z.string().cuid(),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  caption: z.string().max(500).optional(),
});

// ─── Approvals ───────────────────────────────────────

export const requestApprovalSchema = z.object({
  taskId: z.string().cuid(),
  notes: z.string().max(2000).optional(),
});

export const resolveApprovalSchema = z.object({
  approvalId: z.string().cuid(),
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
  notes: z.string().max(2000).optional(),
});

// ─── Users ───────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.nativeEnum(RoleType),
  areaId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional(),
  phone: z.string().max(20).optional(),
});

export const userListFilterSchema = z.object({
  areaId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  role: z.nativeEnum(RoleType).optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

// ─── Reports ─────────────────────────────────────────

export const reportFilterSchema = z.object({
  areaId: z.string().cuid().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM").optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  granularity: z.enum(["day", "week", "month"]).default("week"),
});

// ─── Quick Report (Operario) ─────────────────────────

export const quickReportSchema = z.object({
  type: z.enum([
    "stock_shortage",
    "damaged_equipment",
    "blocked_process",
    "accident",
    "other",
  ]),
  details: z.string().min(10, "Describe el problema con al menos 10 caracteres").max(2000),
  photoUrl: z.string().url().optional(),
  areaId: z.string().cuid(),
  departmentId: z.string().cuid().optional(),
});

export const QUICK_REPORT_LABELS: Record<string, string> = {
  stock_shortage: "Falta de stock",
  damaged_equipment: "Equipo dañado",
  blocked_process: "Proceso bloqueado",
  accident: "Accidente",
  other: "Otro",
};

export const QUICK_REPORT_PRIORITIES: Record<string, Priority> = {
  stock_shortage: Priority.HIGH,
  damaged_equipment: Priority.CRITICAL,
  blocked_process: Priority.HIGH,
  accident: Priority.CRITICAL,
  other: Priority.MEDIUM,
};
