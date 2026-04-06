"use client";

import { useUIStore } from "@/store/ui-store";
import { trpc } from "@/lib/trpc-client";
import { cn, formatRelativeDate } from "@/lib/utils";
import { NOTIFICATION_ICONS } from "@/types";
import { X, Check, BellOff } from "lucide-react";
import Link from "next/link";
import type { NotificationType } from "@prisma/client";

const ICON_COLORS: Record<NotificationType, string> = {
  TASK_ASSIGNED: "text-blue-500",
  TASK_APPROVED: "text-green-500",
  TASK_REJECTED: "text-red-500",
  TASK_DUE_SOON: "text-amber-500",
  TASK_OVERDUE: "text-red-600",
  APPROVAL_REQUESTED: "text-purple-500",
  COMMENT_MENTION: "text-indigo-500",
  STOCK_ALERT: "text-orange-500",
};

export function NotificationDrawer() {
  const { notificationDrawerOpen, setNotificationDrawerOpen } = useUIStore();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notifications.list.useQuery(
    { page: 1, limit: 30 },
    { enabled: notificationDrawerOpen }
  );

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });

  if (!notificationDrawerOpen) return null;

  const notifications = data?.notifications ?? [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={() => setNotificationDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-xl dark:bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Notificaciones
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markRead.mutate({ all: true })}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
              disabled={markRead.isPending}
            >
              <Check className="h-3.5 w-3.5" />
              Marcar todo
            </button>
            <button
              onClick={() => setNotificationDrawerOpen(false)}
              className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <BellOff className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
              <p className="text-sm text-zinc-500">Estás al día 👏</p>
              <p className="text-xs text-zinc-400">No hay notificaciones pendientes</p>
            </div>
          )}

          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notif.taskId ? `/tasks/${notif.taskId}` : "#"}
              onClick={() => {
                if (!notif.isRead) {
                  markRead.mutate({ notificationId: notif.id });
                }
                setNotificationDrawerOpen(false);
              }}
              className={cn(
                "flex gap-3 border-b border-zinc-100 px-4 py-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                !notif.isRead && "bg-indigo-50/50 dark:bg-indigo-950/20"
              )}
            >
              <div className={cn("mt-0.5 flex-shrink-0", ICON_COLORS[notif.type])}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {!notif.isRead && <span className="h-2 w-2 rounded-full bg-indigo-600" />}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm",
                  notif.isRead ? "text-zinc-600 dark:text-zinc-400" : "font-medium text-zinc-900 dark:text-white"
                )}>
                  {notif.title}
                </p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{notif.body}</p>
                <p className="mt-1 text-[10px] text-zinc-400">
                  {formatRelativeDate(notif.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
