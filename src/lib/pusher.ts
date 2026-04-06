import Pusher from "pusher";
import PusherClient from "pusher-js";

// ─── Server-side Pusher instance ─────────────────────

let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID ?? "",
      key: process.env.NEXT_PUBLIC_PUSHER_KEY ?? "",
      secret: process.env.PUSHER_SECRET ?? "",
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
      useTLS: true,
    });
  }
  return pusherServer;
}

// ─── Client-side Pusher instance ─────────────────────

let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    pusherClient = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY ?? "",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "us2",
      }
    );
  }
  return pusherClient;
}

// ─── Channel helpers ─────────────────────────────────

export function getUserChannel(userId: string): string {
  return `private-user-${userId}`;
}

export function getAreaChannel(areaId: string): string {
  return `private-area-${areaId}`;
}

export function getTaskChannel(taskId: string): string {
  return `private-task-${taskId}`;
}

// ─── Event types ─────────────────────────────────────

export const PUSHER_EVENTS = {
  NOTIFICATION_NEW: "notification:new",
  TASK_UPDATED: "task:updated",
  TASK_COMMENT: "task:comment",
  APPROVAL_NEW: "approval:new",
} as const;
