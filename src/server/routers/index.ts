import { router } from "@/server/trpc";
import { tasksRouter } from "@/server/routers/tasks.router";
import { usersRouter } from "@/server/routers/users.router";
import { notificationsRouter } from "@/server/routers/notifications.router";
import { reportsRouter } from "@/server/routers/reports.router";

export const appRouter = router({
  tasks: tasksRouter,
  users: usersRouter,
  notifications: notificationsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
