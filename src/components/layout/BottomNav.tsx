"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import type { RoleType } from "@prisma/client";
import {
  LayoutDashboard,
  ListTodo,
  Bell,
  User,
  ShieldCheck,
} from "lucide-react";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: RoleType[];
}

const OPERARIO_NAV: BottomNavItem[] = [
  { href: "/", label: "Inicio", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["OPERARIO"] },
  { href: "/tasks", label: "Tareas", icon: <ListTodo className="h-5 w-5" />, roles: ["OPERARIO"] },
  { href: "/notifications", label: "Alertas", icon: <Bell className="h-5 w-5" />, roles: ["OPERARIO"] },
  { href: "/settings/profile", label: "Perfil", icon: <User className="h-5 w-5" />, roles: ["OPERARIO"] },
];

const SUPERVISOR_NAV: BottomNavItem[] = [
  { href: "/", label: "Inicio", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["SUPERVISOR"] },
  { href: "/tasks", label: "Tareas", icon: <ListTodo className="h-5 w-5" />, roles: ["SUPERVISOR"] },
  { href: "/approvals", label: "Aprobar", icon: <ShieldCheck className="h-5 w-5" />, roles: ["SUPERVISOR"] },
  { href: "/notifications", label: "Alertas", icon: <Bell className="h-5 w-5" />, roles: ["SUPERVISOR"] },
  { href: "/settings/profile", label: "Perfil", icon: <User className="h-5 w-5" />, roles: ["SUPERVISOR"] },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as RoleType | undefined;

  if (!role) return null;

  // Only show bottom nav on mobile for OPERARIO and SUPERVISOR
  const items = role === "OPERARIO" ? OPERARIO_NAV : role === "SUPERVISOR" ? SUPERVISOR_NAV : null;
  if (!items) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-1 lg:hidden"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border-subtle)",
      }}
    >
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-2"
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: isActive ? "#818cf8" : "var(--text-muted)",
              transition: "color 0.15s",
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
