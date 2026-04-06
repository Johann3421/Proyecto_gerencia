"use client";

import { useUIStore } from "@/store/ui-store";
import { trpc } from "@/lib/trpc-client";
import { formatRelativeDate } from "@/lib/utils";
import { X, Check, BellOff } from "lucide-react";
import Link from "next/link";
import type { NotificationType } from "@prisma/client";

const ICON_COLORS: Record<NotificationType, string> = {
  TASK_ASSIGNED: "var(--info)",
  TASK_APPROVED: "var(--success)",
  TASK_REJECTED: "var(--danger)",
  TASK_DUE_SOON: "var(--warning)",
  TASK_OVERDUE: "var(--danger)",
  APPROVAL_REQUESTED: "#a78bfa",
  COMMENT_MENTION: "#818cf8",
  STOCK_ALERT: "var(--warning)",
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
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        onClick={() => setNotificationDrawerOpen(false)}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col"
        style={{
          background: "var(--bg-surface)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)" }}>
            Notificaciones
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => markRead.mutate({ all: true })}
              className="flex items-center gap-1 rounded-md px-2 py-1"
              style={{ fontSize: 12, color: "#818cf8", transition: "opacity 0.15s" }}
              disabled={markRead.isPending}
            >
              <Check className="h-3.5 w-3.5" />
              Marcar todo
            </button>
            <button
              onClick={() => setNotificationDrawerOpen(false)}
              className="rounded-md p-1"
              style={{ color: "var(--text-muted)" }}
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
                <div key={i} className="nexus-skeleton" style={{ height: 64, borderRadius: "var(--radius-md)" }} />
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <BellOff size={48} style={{ color: "var(--text-muted)" }} />
              <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Estás al día 👏</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>No hay notificaciones pendientes</p>
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
              className="flex gap-3 px-4 py-3"
              style={{
                borderBottom: "1px solid var(--border-subtle)",
                background: !notif.isRead ? "rgba(99,102,241,0.06)" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-elevated)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = !notif.isRead ? "rgba(99,102,241,0.06)" : "transparent";
              }}
            >
              <div className="mt-0.5 flex-shrink-0">
                <div
                  className="flex h-8 w-8 items-center justify-center"
                  style={{
                    borderRadius: "100%",
                    background: "var(--bg-elevated)",
                  }}
                >
                  {!notif.isRead ? (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "100%",
                        background: ICON_COLORS[notif.type],
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "100%",
                        background: "var(--text-disabled)",
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: notif.isRead ? 400 : 500,
                    color: notif.isRead ? "var(--text-secondary)" : "var(--text-primary)",
                  }}
                >
                  {notif.title}
                </p>
                <p
                  className="truncate"
                  style={{ marginTop: 2, fontSize: 12, color: "var(--text-muted)" }}
                >
                  {notif.body}
                </p>
                <p style={{ marginTop: 4, fontSize: 10, color: "var(--text-disabled)" }}>
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
