"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import type { RoleType } from "@prisma/client";
import { ROLE_LABELS } from "@/types";
import {
  LayoutDashboard,
  ListTodo,
  Building2,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: RoleType[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "OPERARIO", "AUDITOR"],
  },
  {
    href: "/tasks",
    label: "Tareas",
    icon: <ListTodo className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "OPERARIO"],
  },
  {
    href: "/areas",
    label: "Áreas",
    icon: <Building2 className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "AUDITOR"],
  },
  {
    href: "/team",
    label: "Equipo",
    icon: <Users className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR"],
  },
  {
    href: "/reports",
    label: "Reportes",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "AUDITOR"],
  },
  {
    href: "/approvals",
    label: "Aprobaciones",
    icon: <ShieldCheck className="h-5 w-5" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR"],
  },
  {
    href: "/settings",
    label: "Configuración",
    icon: <Settings className="h-5 w-5" />,
    roles: ["SUPER_ADMIN"],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapse } = useUIStore();

  const userRole = session?.user?.role as RoleType | undefined;
  const filteredItems = NAV_ITEMS.filter((item) =>
    userRole ? item.roles.includes(userRole) : false
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-[220px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        {/* Header */}
        <div
          className="flex h-16 items-center justify-between px-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center text-white text-xs font-bold"
                style={{
                  background: "#4f46e5",
                  borderRadius: "var(--radius-md)",
                }}
              >
                N
              </div>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: "var(--text-primary)",
                }}
              >
                NEXUS
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link
              href="/"
              className="mx-auto flex h-7 w-7 items-center justify-center text-white text-xs font-bold"
              style={{
                background: "#4f46e5",
                borderRadius: "var(--radius-md)",
              }}
            >
              N
            </Link>
          )}

          {/* Close button mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 lg:hidden"
            style={{ color: "var(--text-secondary)" }}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse button desktop */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:block rounded-md p-1"
            style={{ color: "var(--text-muted)" }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 transition-all",
                  sidebarCollapsed && "justify-center px-2"
                )}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: 14,
                  fontWeight: 450,
                  color: isActive ? "#818cf8" : "var(--text-secondary)",
                  background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                  borderLeft: isActive ? "2px solid #818cf8" : "2px solid transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "var(--bg-elevated)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {item.icon}
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {session?.user && !sidebarCollapsed && (
          <div style={{ borderTop: "1px solid var(--border-subtle)", padding: 16 }}>
            <Link
              href="/settings/profile"
              className="flex items-center gap-3 rounded-lg p-2"
              style={{ transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-elevated)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <div
                className="flex items-center justify-center text-white text-xs font-bold"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "100%",
                  background: "#4f46e5",
                }}
              >
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate"
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}
                >
                  {session.user.name}
                </p>
                <p
                  className="truncate"
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {ROLE_LABELS[session.user.role as RoleType] ?? session.user.role}
                </p>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
