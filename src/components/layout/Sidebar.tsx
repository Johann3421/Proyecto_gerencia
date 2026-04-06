"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { trpc } from "@/lib/trpc-client";
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
  X,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: RoleType[];
  group: "MAIN" | "ANALYSIS" | "SETTINGS";
  badge?: "approvals";
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "OPERARIO", "AUDITOR"],
    group: "MAIN",
  },
  {
    href: "/tasks",
    label: "Tareas",
    icon: <ListTodo className="h-4 w-4" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "OPERARIO"],
    group: "MAIN",
  },
  {
    href: "/approvals",
    label: "Aprobaciones",
    icon: <ShieldCheck className="h-4 w-4" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR"],
    group: "MAIN",
    badge: "approvals",
  },
  {
    href: "/areas",
    label: "Áreas",
    icon: <Building2 className="h-4 w-4" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "AUDITOR"],
    group: "ANALYSIS",
  },
  {
    href: "/team",
    label: "Equipo",
    icon: <Users className="h-4 w-4" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR"],
    group: "ANALYSIS",
  },
  {
    href: "/reports",
    label: "Reportes",
    icon: <BarChart3 className="h-4 w-4" />,
    roles: ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR", "AUDITOR"],
    group: "ANALYSIS",
  },
  {
    href: "/settings",
    label: "Configuración",
    icon: <Settings className="h-4 w-4" />,
    roles: ["SUPER_ADMIN"],
    group: "SETTINGS",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useUIStore();

  const userRole = session?.user?.role as RoleType | undefined;
  const filteredItems = NAV_ITEMS.filter((item) =>
    userRole ? item.roles.includes(userRole) : false
  );

  // Badge data
  const { data: approvalsData } = trpc.tasks.list.useQuery(
    { status: "AWAITING_REVIEW", limit: 1 },
    { enabled: !!userRole && ["SUPER_ADMIN", "ADMIN_AREA", "SUPERVISOR"].includes(userRole) }
  );
  const pendingApprovalsCount = approvalsData?.pagination?.total ?? 0;

  const groupedItems = {
    MAIN: filteredItems.filter(i => i.group === "MAIN"),
    ANALYSIS: filteredItems.filter(i => i.group === "ANALYSIS"),
    SETTINGS: filteredItems.filter(i => i.group === "SETTINGS"),
  };

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
          "fixed left-0 top-0 z-50 flex h-full flex-col transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-[220px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "var(--sidebar-bg)" }}
      >
        {/* Header */}
        <div className="flex h-12 items-center justify-between px-4 mt-2">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center text-white text-[10px] font-bold"
                style={{ background: "var(--accent)", borderRadius: 6 }}
              >
                N
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", letterSpacing: "0.03em" }}>
                NEXUS
              </span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link
              href="/"
              className="mx-auto flex h-6 w-6 items-center justify-center text-white text-[10px] font-bold"
              style={{ background: "var(--accent)", borderRadius: 6 }}
            >
              N
            </Link>
          )}

          {/* Close button mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 lg:hidden"
            style={{ color: "var(--sidebar-text)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(Object.keys(groupedItems) as Array<keyof typeof groupedItems>).map(group => {
            const items = groupedItems[group];
            if (items.length === 0) return null;

            return (
              <div key={group} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Group Label */}
                {group !== "MAIN" && !sidebarCollapsed && (
                  <div style={{ padding: "0 10px", marginBottom: 4, fontSize: 10.5, color: "var(--sidebar-label)", letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 500 }}>
                    {group}
                  </div>
                )}
                {group !== "MAIN" && sidebarCollapsed && (
                  <div style={{ margin: "4px 8px", borderTop: "1px solid rgba(255,255,255,0.1)" }} />
                )}

                {/* Items */}
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                  const badgeCount = item.badge === "approvals" ? pendingApprovalsCount : 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-2 transition-all relative",
                        sidebarCollapsed && "justify-center px-0 w-8 mx-auto"
                      )}
                      style={{
                        padding: sidebarCollapsed ? "6px 0" : "6px 10px",
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                        background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = "var(--sidebar-text)";
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <div style={{ position: "absolute", left: sidebarCollapsed ? -8 : 0, top: 4, bottom: 4, width: 2, background: "var(--sidebar-active-border)", borderRadius: "0 2px 2px 0" }} />
                      )}
                      
                      {item.icon}
                      {!sidebarCollapsed && <span style={{ flex: 1 }}>{item.label}</span>}

                      {!sidebarCollapsed && badgeCount > 0 && (
                        <span style={{
                          background: "#ef4444", color: "#fff", borderRadius: 9999,
                          fontSize: 10, fontWeight: 600, padding: "1px 6px"
                        }}>
                          {badgeCount}
                        </span>
                      )}
                      {sidebarCollapsed && badgeCount > 0 && (
                        <span style={{
                          position: "absolute", top: -2, right: -4,
                          width: 6, height: 6, borderRadius: "50%", background: "#ef4444"
                        }} />
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
