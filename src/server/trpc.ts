import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { RoleType } from "@prisma/client";
import { hasPermission, type SessionUser } from "@/lib/permissions";
import superjson from "superjson";

// ─── Context ─────────────────────────────────────────

export async function createTRPCContext() {
  const session = await auth();

  return {
    db,
    session,
    user: session?.user
      ? ({
          id: session.user.id,
          role: session.user.role,
          areaId: session.user.areaId,
          departmentId: session.user.departmentId,
        } as SessionUser)
      : null,
  };
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// ─── tRPC Init ───────────────────────────────────────

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// ─── Middleware: Auth Required ────────────────────────

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Debes iniciar sesión" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// ─── Middleware: Role-based Permission Check ─────────

export function requirePermission(
  category: "tasks" | "users" | "reports" | "approvals",
  action: string
) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const allowed = hasPermission(
      ctx.user,
      category as Parameters<typeof hasPermission>[1],
      action as never
    );

    if (!allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No tienes permisos para esta acción",
      });
    }

    return next({ ctx: { user: ctx.user, session: ctx.session! } });
  });
}

// ─── Middleware: Role Guard (simple role array check) ─

export function requireRole(...roles: RoleType[]) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Rol insuficiente para esta acción",
      });
    }
    return next({ ctx: { user: ctx.user, session: ctx.session! } });
  });
}
