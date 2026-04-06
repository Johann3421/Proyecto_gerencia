import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import {
  router,
  protectedProcedure,
  requirePermission,
  requireRole,
} from "@/server/trpc";
import {
  createUserSchema,
  updateProfileSchema,
  userListFilterSchema,
} from "@/lib/validations";
import { buildUserScopeFilter } from "@/lib/permissions";
import { RoleType } from "@prisma/client";

export const usersRouter = router({
  // ─── List users (scoped by role) ───────────────────
  list: protectedProcedure
    .input(userListFilterSchema)
    .query(async ({ ctx, input }) => {
      const scopeFilter = buildUserScopeFilter(ctx.user);
      const where: Record<string, unknown> = {
        ...scopeFilter,
        isActive: true,
        deletedAt: null,
      };

      if (input.areaId) where.areaId = input.areaId;
      if (input.departmentId) where.departmentId = input.departmentId;
      if (input.role) where.role = input.role;

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { email: { contains: input.search, mode: "insensitive" } },
        ];
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            areaId: true,
            departmentId: true,
            area: { select: { id: true, name: true, color: true } },
            department: { select: { id: true, name: true } },
            lastLoginAt: true,
            createdAt: true,
          },
          orderBy: { name: "asc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  // ─── Get user by ID ───────────────────────────────
  byId: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.id, isActive: true, deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          areaId: true,
          departmentId: true,
          area: { select: { id: true, name: true, color: true, icon: true } },
          department: { select: { id: true, name: true } },
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              tasksAssigned: true,
              tasksCreated: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado" });
      }

      return user;
    }),

  // ─── Create user (SUPER_ADMIN only) ────────────────
  create: protectedProcedure
    .use(requireRole(RoleType.SUPER_ADMIN))
    .input(createUserSchema)
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({ where: { email: input.email } });
      if (exists) {
        throw new TRPCError({ code: "CONFLICT", message: "El email ya está registrado" });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const user = await ctx.db.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          role: input.role,
          areaId: input.areaId,
          departmentId: input.departmentId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      return user;
    }),

  // ─── Update user role (SUPER_ADMIN only) ──────────
  updateRole: protectedProcedure
    .use(requireRole(RoleType.SUPER_ADMIN))
    .input(
      z.object({
        userId: z.string().cuid(),
        role: z.nativeEnum(RoleType),
        areaId: z.string().cuid().optional(),
        departmentId: z.string().cuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          role: input.role,
          areaId: input.areaId ?? null,
          departmentId: input.departmentId ?? null,
        },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  // ─── Deactivate user (soft delete) ────────────────
  deactivate: protectedProcedure
    .use(requireRole(RoleType.SUPER_ADMIN))
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No puedes desactivarte a ti mismo" });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { isActive: false, deletedAt: new Date() },
        select: { id: true, name: true },
      });
    }),

  // ─── Update own profile ───────────────────────────
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.avatar && { avatar: input.avatar }),
          ...(input.phone !== undefined && { phone: input.phone }),
        },
        select: { id: true, name: true, avatar: true, phone: true },
      });
    }),

  // ─── Get current user ─────────────────────────────
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        areaId: true,
        departmentId: true,
        area: { select: { id: true, name: true, color: true, icon: true, slug: true } },
        department: { select: { id: true, name: true } },
        lastLoginAt: true,
      },
    });
  }),
});
