"use client";

import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/store/ui-store";
import { trpc } from "@/lib/trpc-client";
import { Bell, Menu, LogOut, User } from "lucide-react";
import Link from "next/link";

export function Topbar() {
  const { data: session } = useSession();
  const { toggleSidebar, setNotificationDrawerOpen } = useUIStore();

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: !!session?.user,
    refetchInterval: 30000,
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80 lg:px-6">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-md p-2 hover:bg-zinc-100 lg:hidden dark:hover:bg-zinc-800"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-zinc-600" />
        </button>

        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-bold">
            N
          </div>
        </Link>
      </div>

      {/* Right: notification bell + user menu */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          onClick={() => setNotificationDrawerOpen(true)}
          className="relative rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar / menu */}
        {session?.user && (
          <div className="flex items-center gap-2">
            <Link
              href="/settings/profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-bold hover:ring-2 hover:ring-indigo-300"
            >
              {session.user.name?.charAt(0).toUpperCase()}
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="hidden rounded-md p-2 hover:bg-zinc-100 sm:block dark:hover:bg-zinc-800"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4 text-zinc-500" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
