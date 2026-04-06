"use client";

import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { trpc } from "@/lib/trpc-client";
import { usePathname } from "next/navigation";
import { Bell, Menu, LogOut } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tareas",
  "/areas": "Áreas",
  "/team": "Equipo",
  "/reports": "Reportes",
  "/approvals": "Aprobaciones",
  "/settings": "Configuración",
};

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/tasks/new")) return "Nueva tarea";
  if (pathname.startsWith("/tasks/")) return "Detalle de tarea";
  if (pathname.startsWith("/areas/")) return "Detalle de área";
  if (pathname.startsWith("/settings")) return "Configuración";
  return "NEXUS";
}

export function Topbar() {
  const { data: session } = useSession();
  const { toggleSidebar, setNotificationDrawerOpen } = useUIStore();
  const pathname = usePathname();

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 30000,
  });

  const hasNotifs = (unreadCount ?? 0) > 0;

  return (
    <header
      style={{
        height: 48,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={toggleSidebar}
          className="lg:hidden"
          style={{ color: "var(--text-2)", padding: 4 }}
          aria-label="Menu"
        >
          <Menu size={18} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
          {getPageTitle(pathname)}
        </span>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Bell */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          style={{
            position: "relative",
            padding: 6,
            color: "var(--text-3)",
            borderRadius: 4,
            transition: "color .1s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text-2)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-3)"; }}
          aria-label="Notificaciones"
        >
          <Bell size={15} />
          {hasNotifs && (
            <span style={{
              position: "absolute", top: 3, right: 3,
              width: 5, height: 5, borderRadius: "50%",
              background: "var(--bad)",
            }} />
          )}
        </button>

        {/* Avatar */}
        {session?.user && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "var(--accent)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700,
              }}
            >
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="hidden sm:block"
              style={{ color: "var(--text-4)", padding: 4 }}
              aria-label="Cerrar sesión"
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
