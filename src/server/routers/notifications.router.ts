import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";

export const notificationsRouter = router({
  // ─── List notifications (current user) ─────────────
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { userId: ctx.user.id };
      if (input.unreadOnly) where.isRead = false;

      const [notifications, total] = await Promise.all([
        ctx.db.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.notification.count({ where }),
      ]);

      return {
        notifications,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // ─── Unread count ──────────────────────────────────
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { userId: ctx.user.id, isRead: false },
    });
  }),

  // ─── Mark as read ──────────────────────────────────
  markRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().cuid().optional(),
        all: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.all) {
        await ctx.db.notification.updateMany({
          where: { userId: ctx.user.id, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        return { success: true, count: "all" };
      }

      if (input.notificationId) {
        await ctx.db.notification.updateMany({
          where: {
            id: input.notificationId,
            userId: ctx.user.id,
          },
          data: { isRead: true, readAt: new Date() },
        });
        return { success: true, count: 1 };
      }

      return { success: false, count: 0 };
    }),
});
