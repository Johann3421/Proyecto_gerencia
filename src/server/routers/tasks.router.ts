import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  protectedProcedure,
  requirePermission,
} from "@/server/trpc";
import {
  createTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  taskListFilterSchema,
  addCommentSchema,
  uploadEvidenceSchema,
  requestApprovalSchema,
  resolveApprovalSchema,
  quickReportSchema,
  QUICK_REPORT_LABELS,
  QUICK_REPORT_PRIORITIES,
} from "@/lib/validations";
import {
  buildTaskScopeFilter,
  canTransitionStatus,
  canAccessArea,
} from "@/lib/permissions";
import {
  createNotification,
  createBulkNotifications,
  createTaskLog,
  notifyAssignee,
  notifySupervisors,
  notifyMentions,
  notifyApprovalChain,
} from "@/lib/notifications";
import { TaskStatus } from "@prisma/client";

export const tasksRouter = router({
  // ─── List tasks (filtered by role scope) ───────────
  list: protectedProcedure
    .input(taskListFilterSchema)
    .query(async ({ ctx, input }) => {
      const scopeFilter = buildTaskScopeFilter(ctx.user);
      const where: Record<string, unknown> = {
        ...scopeFilter,
        deletedAt: null,
      };

      if (input.areaId) where.areaId = input.areaId;
      if (input.departmentId) where.departmentId = input.departmentId;
      if (input.status) where.status = input.status;
      if (input.assignedToId) where.assignedToId = input.assignedToId;
      if (input.priority) where.priority = input.priority;
      if (input.parentTaskId !== undefined) {
        where.parentTaskId = input.parentTaskId;
      }

      if (input.dueDateFrom || input.dueDateTo) {
        where.dueDate = {
          ...(input.dueDateFrom && { gte: input.dueDateFrom }),
          ...(input.dueDateTo && { lte: input.dueDateTo }),
        };
      }

      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [tasks, total] = await Promise.all([
        ctx.db.task.findMany({
          where,
          include: {
            assignedTo: { select: { id: true, name: true, avatar: true, role: true } },
            createdBy: { select: { id: true, name: true } },
            area: { select: { id: true, name: true, color: true, icon: true } },
            department: { select: { id: true, name: true } },
            tags: true,
            _count: { select: { subtasks: true, comments: true, evidence: true } },
          },
          orderBy: [
            { priority: "desc" },
            { dueDate: "asc" },
            { createdAt: "desc" },
          ],
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.task.count({ where }),
      ]);

      return {
        tasks,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // ─── Get task by ID ────────────────────────────────
  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          assignedTo: { select: { id: true, name: true, avatar: true, role: true, email: true } },
          createdBy: { select: { id: true, name: true, avatar: true } },
          area: { select: { id: true, name: true, color: true, icon: true, slug: true } },
          department: { select: { id: true, name: true } },
          parentTask: { select: { id: true, title: true } },
          subtasks: {
            where: { deletedAt: null },
            include: {
              assignedTo: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          comments: {
            include: {
              author: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          evidence: {
            orderBy: { createdAt: "desc" },
          },
          logs: {
            include: {
              user: { select: { id: true, name: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          tags: true,
          approvals: {
            orderBy: { requestedAt: "desc" },
          },
        },
      });

      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada" });
      }

      // Scope check
      const scopeFilter = buildTaskScopeFilter(ctx.user);
      if (scopeFilter.areaId && task.areaId !== scopeFilter.areaId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sin acceso a esta tarea" });
      }
      if (scopeFilter.assignedToId && task.assignedToId !== ctx.user.id && task.createdById !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sin acceso a esta tarea" });
      }

      return task;
    }),

  // ─── Create task ───────────────────────────────────
  create: protectedProcedure
    .use(requirePermission("tasks", "create"))
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      if (!canAccessArea(ctx.user, input.areaId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sin acceso a esta área" });
      }

      const task = await ctx.db.task.create({
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          areaId: input.areaId,
          departmentId: input.departmentId,
          assignedToId: input.assignedToId,
          createdById: ctx.user.id,
          dueDate: input.dueDate,
          estimatedHours: input.estimatedHours,
          parentTaskId: input.parentTaskId,
          tags: input.tagIds ? { connect: input.tagIds.map((id) => ({ id })) } : undefined,
        },
      });

      await createTaskLog(task.id, ctx.user.id, "CREATED", undefined, "PENDING");

      if (input.assignedToId) {
        await notifyAssignee(
          input.assignedToId,
          "TASK_ASSIGNED",
          "Te asignaron una nueva tarea",
          `${task.title}`,
          task.id
        );
        await createTaskLog(task.id, ctx.user.id, "ASSIGNED", undefined, input.assignedToId);
      }

      return task;
    }),

  // ─── Update task status ────────────────────────────
  updateStatus: protectedProcedure
    .input(updateTaskStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.taskId },
        include: { assignedTo: { select: { id: true, name: true } } },
      });

      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada" });
      }

      if (!canTransitionStatus(ctx.user, task.status, input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Transición de ${task.status} a ${input.status} no permitida para tu rol`,
        });
      }

      const updated = await ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          status: input.status,
          completedAt: input.status === TaskStatus.COMPLETED ? new Date() : undefined,
        },
      });

      await createTaskLog(
        task.id,
        ctx.user.id,
        "STATUS_CHANGED",
        task.status,
        input.status
      );

      // Notify relevant people based on new status
      if (input.status === TaskStatus.AWAITING_REVIEW) {
        await notifySupervisors(
          task.areaId,
          task.departmentId,
          task.id,
          "Tarea esperando revisión",
          `${task.title} — requiere aprobación`
        );
      }

      if (input.status === TaskStatus.APPROVED && task.assignedToId) {
        await notifyAssignee(
          task.assignedToId,
          "TASK_APPROVED",
          "Tu tarea fue aprobada",
          task.title,
          task.id
        );
      }

      if (input.status === TaskStatus.REJECTED && task.assignedToId) {
        await notifyAssignee(
          task.assignedToId,
          "TASK_REJECTED",
          "Tu tarea fue rechazada — revisa y corrige",
          task.title,
          task.id
        );
      }

      return updated;
    }),

  // ─── Assign task ───────────────────────────────────
  assign: protectedProcedure
    .use(requirePermission("tasks", "assignTo"))
    .input(assignTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.taskId } });
      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!canAccessArea(ctx.user, task.areaId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const updated = await ctx.db.task.update({
        where: { id: input.taskId },
        data: { assignedToId: input.assignedToId },
      });

      await createTaskLog(
        task.id,
        ctx.user.id,
        "ASSIGNED",
        task.assignedToId ?? undefined,
        input.assignedToId
      );

      await notifyAssignee(
        input.assignedToId,
        "TASK_ASSIGNED",
        "Te asignaron una tarea",
        task.title,
        task.id
      );

      return updated;
    }),

  // ─── Add comment ───────────────────────────────────
  addComment: protectedProcedure
    .input(addCommentSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.taskId } });
      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const comment = await ctx.db.comment.create({
        data: {
          taskId: input.taskId,
          authorId: ctx.user.id,
          content: input.content,
          mentions: input.mentions ?? [],
        },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
      });

      await createTaskLog(task.id, ctx.user.id, "COMMENTED");

      if (input.mentions && input.mentions.length > 0) {
        const author = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: { name: true },
        });
        await notifyMentions(input.mentions, author?.name ?? "Alguien", task.id, task.title);
      }

      return comment;
    }),

  // ─── Upload evidence ───────────────────────────────
  uploadEvidence: protectedProcedure
    .input(uploadEvidenceSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.taskId } });
      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const evidence = await ctx.db.evidence.create({
        data: {
          taskId: input.taskId,
          uploadedBy: ctx.user.id,
          fileUrl: input.fileUrl,
          fileType: input.fileType,
          fileName: input.fileName,
          fileSize: input.fileSize,
          caption: input.caption,
        },
      });

      await createTaskLog(task.id, ctx.user.id, "EVIDENCE_UPLOADED", undefined, input.fileName);

      return evidence;
    }),

  // ─── Request approval ──────────────────────────────
  requestApproval: protectedProcedure
    .use(requirePermission("approvals", "request"))
    .input(requestApprovalSchema)
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.taskId } });
      if (!task || task.deletedAt) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const approval = await ctx.db.approval.create({
        data: {
          taskId: input.taskId,
          requestedBy: ctx.user.id,
          notes: input.notes,
        },
      });

      await createTaskLog(task.id, ctx.user.id, "APPROVAL_REQUESTED");

      // Notify area admin and supervisors
      const admins = await ctx.db.user.findMany({
        where: {
          areaId: task.areaId,
          role: { in: ["ADMIN_AREA", "SUPERVISOR"] },
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (admins.length > 0) {
        await createBulkNotifications(
          admins.map((a) => ({
            userId: a.id,
            type: "APPROVAL_REQUESTED" as const,
            title: "Aprobación pendiente",
            body: `Se solicita aprobación para: ${task.title}`,
            taskId: task.id,
          }))
        );
      }

      return approval;
    }),

  // ─── Resolve approval ─────────────────────────────
  resolveApproval: protectedProcedure
    .use(requirePermission("approvals", "resolve"))
    .input(resolveApprovalSchema)
    .mutation(async ({ ctx, input }) => {
      const approval = await ctx.db.approval.findUnique({
        where: { id: input.approvalId },
        include: { task: true },
      });

      if (!approval) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (approval.status !== "PENDING") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta aprobación ya fue resuelta" });
      }

      const updated = await ctx.db.approval.update({
        where: { id: input.approvalId },
        data: {
          status: input.status,
          approvedBy: ctx.user.id,
          notes: input.notes,
          resolvedAt: new Date(),
        },
      });

      // Update task status based on approval
      const newStatus = input.status === "APPROVED" ? TaskStatus.APPROVED : TaskStatus.REJECTED;
      await ctx.db.task.update({
        where: { id: approval.taskId },
        data: { status: newStatus },
      });

      await createTaskLog(
        approval.taskId,
        ctx.user.id,
        input.status === "APPROVED" ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
        "AWAITING_REVIEW",
        newStatus
      );

      // Notify chain
      const involvedUsers = new Set<string>();
      involvedUsers.add(approval.requestedBy);
      if (approval.task.assignedToId) involvedUsers.add(approval.task.assignedToId);
      if (approval.task.createdById) involvedUsers.add(approval.task.createdById);
      involvedUsers.delete(ctx.user.id); // don't notify self

      const resolver = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { name: true },
      });

      await notifyApprovalChain(
        approval.taskId,
        approval.task.title,
        input.status,
        resolver?.name ?? "Un administrador",
        Array.from(involvedUsers)
      );

      return updated;
    }),

  // ─── Quick report (Operario) ───────────────────────
  quickReport: protectedProcedure
    .input(quickReportSchema)
    .mutation(async ({ ctx, input }) => {
      const label = QUICK_REPORT_LABELS[input.type] ?? input.type;
      const priority = QUICK_REPORT_PRIORITIES[input.type] ?? "MEDIUM";

      const task = await ctx.db.task.create({
        data: {
          title: `${label}: ${input.details.slice(0, 80)}`,
          description: input.details,
          priority,
          status: "PENDING",
          areaId: input.areaId,
          departmentId: input.departmentId,
          createdById: ctx.user.id,
        },
      });

      await createTaskLog(task.id, ctx.user.id, "CREATED", undefined, "PENDING", {
        source: "quick_report",
        reportType: input.type,
      });

      // Upload photo evidence if provided
      if (input.photoUrl) {
        await ctx.db.evidence.create({
          data: {
            taskId: task.id,
            uploadedBy: ctx.user.id,
            fileUrl: input.photoUrl,
            fileType: "image/jpeg",
            fileName: "reporte-foto.jpg",
            fileSize: 0,
            caption: `Evidencia de reporte: ${label}`,
          },
        });
      }

      // Notify supervisors
      await notifySupervisors(
        input.areaId,
        input.departmentId ?? null,
        task.id,
        `⚠️ Nuevo reporte: ${label}`,
        input.details.slice(0, 200)
      );

      return task;
    }),

  // ─── Delete task (soft) ────────────────────────────
  delete: protectedProcedure
    .use(requirePermission("tasks", "delete"))
    .input(z.object({ taskId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.taskId } });
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });

      if (!canAccessArea(ctx.user, task.areaId)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.task.update({
        where: { id: input.taskId },
        data: { deletedAt: new Date() },
      });

      await createTaskLog(task.id, ctx.user.id, "DELETED");

      return { success: true };
    }),
});
