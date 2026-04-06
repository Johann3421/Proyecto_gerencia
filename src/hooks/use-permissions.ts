"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type SessionUser } from "@/lib/permissions";
import type { RoleType } from "@prisma/client";

type PermCategory = "tasks" | "users" | "reports" | "approvals";

export function usePermissions() {
  const { data: session } = useSession();

  const user: SessionUser | null = session?.user
    ? {
        id: session.user.id,
        role: session.user.role as RoleType,
        areaId: session.user.areaId ?? null,
        departmentId: session.user.departmentId ?? null,
      }
    : null;

  function can(category: PermCategory, action: string): boolean {
    if (!user) return false;
    return hasPermission(user, category as Parameters<typeof hasPermission>[1], action as never);
  }

  function isRole(...roles: RoleType[]): boolean {
    if (!user) return false;
    return roles.includes(user.role);
  }

  return { user, can, isRole, session };
}
