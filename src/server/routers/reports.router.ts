import { z } from "zod";
import { router, protectedProcedure, requirePermission } from "@/server/trpc";
import { reportFilterSchema } from "@/lib/validations";
import { buildTaskScopeFilter } from "@/lib/permissions";
import { RoleType } from "@prisma/client";

export const reportsRouter = router({
  // ─── Area KPIs ─────────────────────────────────────
  areaKPIs: protectedProcedure
    .input(reportFilterSchema)
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.areaId) where.areaId = input.areaId;
      if (input.period) where.period = input.period;

      // Scope by role
      if (ctx.user.role === RoleType.ADMIN_AREA && ctx.user.areaId) {
        where.areaId = ctx.user.areaId;
      }

      const kpis = await ctx.db.areaKPI.findMany({
        where,
        include: { area: { select: { id: true, name: true, color: true, icon: true } } },
        orderBy: { period: "desc" },
      });

      return kpis;
    }),

  // ─── Task completion rate ──────────────────────────
  taskCompletionRate: protectedProcedure
    .input(reportFilterSchema)
    .query(async ({ ctx, input }) => {
      const scopeFilter = buildTaskScopeFilter(ctx.user);
      const where: Record<string, unknown> = {
        ...scopeFilter,
        deletedAt: null,
      };

      if (input.areaId) where.areaId = input.areaId;
      if (input.from || input.to) {
        where.createdAt = {
          ...(input.from && { gte: input.from }),
          ...(input.to && { lte: input.to }),
        };
      }

      const [total, completed, overdue, inProgress] = await Promise.all([
        ctx.db.task.count({ where }),
        ctx.db.task.count({ where: { ...where, status: "COMPLETED" } }),
        ctx.db.task.count({
          where: {
            ...where,
            status: { notIn: ["COMPLETED", "APPROVED", "CANCELLED"] },
            dueDate: { lt: new Date() },
          },
        }),
        ctx.db.task.count({ where: { ...where, status: "IN_PROGRESS" } }),
      ]);

      return {
        total,
        completed,
        overdue,
        inProgress,
        completionRate: total > 0 ? Math.min(Math.round((completed / total) * 100), 100) : 0,
      };
    }),

  // ─── Overdue by area ───────────────────────────────
  overdueByArea: protectedProcedure
    .query(async ({ ctx }) => {
      const scopeFilter = buildTaskScopeFilter(ctx.user);

      const areas = await ctx.db.area.findMany({
        select: {
          id: true,
          name: true,
          color: true,
          icon: true,
          _count: {
            select: {
              tasks: {
                where: {
                  ...scopeFilter,
                  deletedAt: null,
                  status: { notIn: ["COMPLETED", "APPROVED", "CANCELLED"] },
                  dueDate: { lt: new Date() },
                },
              },
            },
          },
        },
      });

      return areas.map((a) => ({
        areaId: a.id,
        name: a.name,
        color: a.color,
        icon: a.icon,
        overdueCount: a._count.tasks,
      }));
    }),

  // ─── User productivity ─────────────────────────────
  userProductivity: protectedProcedure
    .input(reportFilterSchema)
    .query(async ({ ctx, input }) => {
      const scopeFilter = buildTaskScopeFilter(ctx.user);
      const dateFilter: Record<string, unknown> = {};
      if (input.from || input.to) {
        dateFilter.completedAt = {
          ...(input.from && { gte: input.from }),
          ...(input.to && { lte: input.to }),
        };
      }

      const users = await ctx.db.user.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          ...(ctx.user.role === RoleType.ADMIN_AREA ? { areaId: ctx.user.areaId } : {}),
          ...(ctx.user.role === RoleType.SUPERVISOR
            ? { areaId: ctx.user.areaId, departmentId: ctx.user.departmentId }
            : {}),
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          role: true,
          _count: {
            select: {
              tasksAssigned: {
                where: { status: "COMPLETED", deletedAt: null, ...dateFilter },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return users.map((u) => ({
        userId: u.id,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
        completedTasks: u._count.tasksAssigned,
      }));
    }),

  // ─── Audit log ─────────────────────────────────────
  auditLog: protectedProcedure
    .use(requirePermission("reports", "viewGlobal"))
    .input(
      z.object({
        areaId: z.string().cuid().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};
      if (input.from || input.to) {
        where.createdAt = {
          ...(input.from && { gte: input.from }),
          ...(input.to && { lte: input.to }),
        };
      }
      if (input.areaId) {
        where.task = { areaId: input.areaId };
      }

      const [logs, total] = await Promise.all([
        ctx.db.taskLog.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            task: { select: { id: true, title: true, areaId: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.taskLog.count({ where }),
      ]);

      return {
        logs,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),
});
