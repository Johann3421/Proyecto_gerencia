"use client";

import { useEffect, useCallback, useRef } from "react";
import { getPusherClient, getUserChannel, PUSHER_EVENTS } from "@/lib/pusher";
import type { Channel } from "pusher-js";

export function useRealtime(userId: string | undefined, onNotification?: (data: unknown) => void) {
  const channelRef = useRef<Channel | null>(null);

  const handleNotification = useCallback(
    (data: unknown) => {
      onNotification?.(data);
    },
    [onNotification]
  );

  useEffect(() => {
    if (!userId) return;

    const pusher = getPusherClient();
    const channelName = getUserChannel(userId);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind(PUSHER_EVENTS.NOTIFICATION_NEW, handleNotification);
    channel.bind(PUSHER_EVENTS.TASK_UPDATED, handleNotification);

    return () => {
      channel.unbind(PUSHER_EVENTS.NOTIFICATION_NEW, handleNotification);
      channel.unbind(PUSHER_EVENTS.TASK_UPDATED, handleNotification);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
    };
  }, [userId, handleNotification]);

  return channelRef;
}
