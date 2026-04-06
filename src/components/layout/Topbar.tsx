"use client";

import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { trpc } from "@/lib/trpc-client";
import { Bell, Menu, LogOut } from "lucide-react";
import Link from "next/link";

export function Topbar() {
  const { data: session } = useSession();
  const { toggleSidebar, setNotificationDrawerOpen } = useUIStore();

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 30000,
  });

  const hasNotifs = unreadCount !== undefined && unreadCount > 0;

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6"
      style={{
        height: 56,
        background: "var(--bg-page)",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      {/* Left: hamburger + mobile logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 lg:hidden"
          style={{ color: "var(--text-secondary)" }}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div
            className="flex h-7 w-7 items-center justify-center text-white text-xs font-bold"
            style={{ background: "#4f46e5", borderRadius: "var(--radius-md)" }}
          >
            N
          </div>
        </Link>
      </div>

      {/* Right: notification bell + user menu */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          className="relative rounded-md p-2"
          style={{ color: "var(--text-secondary)", transition: "color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
          aria-label={hasNotifs ? `${unreadCount} notificaciones sin leer` : "Notificaciones"}
          title={hasNotifs ? `${unreadCount} notificaciones sin leer` : "Notificaciones"}
        >
          <Bell className="h-5 w-5" />
          {hasNotifs && (
            <span
              className="notif-dot-pulse"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--danger)",
              }}
            />
          )}
        </button>

        {/* User avatar / menu */}
        {session?.user && (
          <div className="flex items-center gap-2">
            <Link
              href="/settings/profile"
              className="flex items-center justify-center text-white text-xs font-bold"
              style={{
                width: 32,
                height: 32,
                borderRadius: "100%",
                background: "#4f46e5",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(129,140,248,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
              title={session.user.name ?? "Perfil"}
            >
              {session.user.name?.charAt(0).toUpperCase()}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="hidden sm:block rounded-md p-2"
              style={{ color: "var(--text-muted)", transition: "color 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
