"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import type { RoleType } from "@prisma/client";
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
  badge?: number;
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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950",
          sidebarCollapsed ? "w-16" : "w-60",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
                N
              </div>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">NEXUS</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/" className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
              N
            </Link>
          )}

          {/* Close button mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Collapse button desktop */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden rounded-md p-1 hover:bg-zinc-100 lg:block dark:hover:bg-zinc-800"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white",
                  sidebarCollapsed && "justify-center px-2"
                )}
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
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
            <Link href="/settings/profile" className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                  {session.user.name}
                </p>
                <p className="truncate text-xs text-zinc-500">{session.user.role}</p>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
