import { RoleType } from "@prisma/client";

// ─── Permission Matrix ───────────────────────────────

export const PERMISSIONS = {
  tasks: {
    create: [RoleType.SUPER_ADMIN, RoleType.ADMIN_AREA, RoleType.SUPERVISOR] as RoleType[],
    readOwn: [RoleType.OPERARIO] as RoleType[],
    readArea: [RoleType.ADMIN_AREA, RoleType.SUPERVISOR] as RoleType[],
    readAll: [RoleType.SUPER_ADMIN, RoleType.AUDITOR] as RoleType[],
    updateStatus: [RoleType.OPERARIO] as RoleType[],
    approve: [RoleType.SUPERVISOR, RoleType.ADMIN_AREA, RoleType.SUPER_ADMIN] as RoleType[],
    delete: [RoleType.SUPER_ADMIN, RoleType.ADMIN_AREA] as RoleType[],
    assignTo: [RoleType.SUPERVISOR, RoleType.ADMIN_AREA, RoleType.SUPER_ADMIN] as RoleType[],
  },
  users: {
    create: [RoleType.SUPER_ADMIN] as RoleType[],
    readAll: [RoleType.SUPER_ADMIN, RoleType.ADMIN_AREA] as RoleType[],
    updateRole: [RoleType.SUPER_ADMIN] as RoleType[],
    deactivate: [RoleType.SUPER_ADMIN] as RoleType[],
  },
  reports: {
    viewOwn: [RoleType.OPERARIO, RoleType.SUPERVISOR, RoleType.ADMIN_AREA] as RoleType[],
    viewArea: [RoleType.ADMIN_AREA, RoleType.SUPERVISOR] as RoleType[],
    viewGlobal: [RoleType.SUPER_ADMIN, RoleType.AUDITOR] as RoleType[],
    export: [RoleType.SUPER_ADMIN, RoleType.AUDITOR, RoleType.ADMIN_AREA] as RoleType[],
  },
  approvals: {
    request: [RoleType.OPERARIO, RoleType.SUPERVISOR] as RoleType[],
    resolve: [RoleType.SUPERVISOR, RoleType.ADMIN_AREA, RoleType.SUPER_ADMIN] as RoleType[],
  },
} as const;

// ─── Types ───────────────────────────────────────────

type PermissionCategory = keyof typeof PERMISSIONS;
type PermissionAction<C extends PermissionCategory> = keyof (typeof PERMISSIONS)[C];

export interface SessionUser {
  id: string;
  role: RoleType;
  areaId: string | null;
  departmentId: string | null;
}

// ─── Core Permission Check ──────────────────────────

/**
 * Check if a user has permission to perform an action
 */
export function hasPermission<C extends PermissionCategory>(
  user: SessionUser,
  category: C,
  action: PermissionAction<C>
): boolean {
  const allowedRoles = PERMISSIONS[category][action] as readonly RoleType[];
  return allowedRoles.includes(user.role);
}

/**
 * Check if user can access a specific area's resources
 */
export function canAccessArea(user: SessionUser, targetAreaId: string): boolean {
  if (user.role === RoleType.SUPER_ADMIN || user.role === RoleType.AUDITOR) {
    return true;
  }
  if (user.role === RoleType.ADMIN_AREA) {
    return user.areaId === targetAreaId;
  }
  if (user.role === RoleType.SUPERVISOR || user.role === RoleType.OPERARIO) {
    return user.areaId === targetAreaId;
  }
  return false;
}

/**
 * Check if user can access a specific department's resources
 */
export function canAccessDepartment(
  user: SessionUser,
  targetAreaId: string,
  targetDepartmentId: string | null
): boolean {
  if (user.role === RoleType.SUPER_ADMIN || user.role === RoleType.AUDITOR) {
    return true;
  }
  if (user.role === RoleType.ADMIN_AREA) {
    return user.areaId === targetAreaId;
  }
  if (user.role === RoleType.SUPERVISOR) {
    return user.areaId === targetAreaId && user.departmentId === targetDepartmentId;
  }
  if (user.role === RoleType.OPERARIO) {
    return user.areaId === targetAreaId && user.departmentId === targetDepartmentId;
  }
  return false;
}

// ─── Task-Specific Permission Checks ────────────────

/**
 * Valid status transitions per role
 */
export const STATUS_TRANSITIONS: Record<RoleType, Record<string, string[]>> = {
  [RoleType.OPERARIO]: {
    PENDING: ["IN_PROGRESS"],
    IN_PROGRESS: ["AWAITING_REVIEW", "BLOCKED"],
    REJECTED: ["IN_PROGRESS"],
  },
  [RoleType.SUPERVISOR]: {
    PENDING: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["AWAITING_REVIEW", "BLOCKED"],
    BLOCKED: ["IN_PROGRESS", "CANCELLED"],
    AWAITING_REVIEW: ["APPROVED", "REJECTED"],
    APPROVED: ["COMPLETED"],
  },
  [RoleType.ADMIN_AREA]: {
    PENDING: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["AWAITING_REVIEW", "BLOCKED"],
    BLOCKED: ["IN_PROGRESS", "CANCELLED"],
    AWAITING_REVIEW: ["APPROVED", "REJECTED"],
    APPROVED: ["COMPLETED"],
    REJECTED: ["IN_PROGRESS"],
  },
  [RoleType.SUPER_ADMIN]: {
    PENDING: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["AWAITING_REVIEW", "BLOCKED", "COMPLETED"],
    BLOCKED: ["IN_PROGRESS", "CANCELLED"],
    AWAITING_REVIEW: ["APPROVED", "REJECTED"],
    APPROVED: ["COMPLETED"],
    REJECTED: ["IN_PROGRESS", "CANCELLED"],
    COMPLETED: ["IN_PROGRESS"],
    CANCELLED: ["PENDING"],
  },
  [RoleType.AUDITOR]: {},
};

/**
 * Check if a status transition is valid for the user's role
 */
export function canTransitionStatus(
  user: SessionUser,
  fromStatus: string,
  toStatus: string
): boolean {
  const transitions = STATUS_TRANSITIONS[user.role];
  const allowed = transitions[fromStatus];
  return allowed ? allowed.includes(toStatus) : false;
}

/**
 * Build Prisma where clause for task queries scoped by role
 */
export function buildTaskScopeFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case RoleType.SUPER_ADMIN:
    case RoleType.AUDITOR:
      return {}; // No filter — access to all tasks
    case RoleType.ADMIN_AREA:
      return { areaId: user.areaId };
    case RoleType.SUPERVISOR:
      return { areaId: user.areaId, departmentId: user.departmentId };
    case RoleType.OPERARIO:
      return { assignedToId: user.id };
    default:
      return { id: "__NONE__" }; // No access
  }
}

/**
 * Build Prisma where clause for user queries scoped by role
 */
export function buildUserScopeFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case RoleType.SUPER_ADMIN:
    case RoleType.AUDITOR:
      return {};
    case RoleType.ADMIN_AREA:
      return { areaId: user.areaId };
    case RoleType.SUPERVISOR:
      return { areaId: user.areaId, departmentId: user.departmentId };
    default:
      return { id: user.id };
  }
}
