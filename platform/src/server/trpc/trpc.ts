import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "../auth";
import { db } from "../db";
import { ZodError } from "zod";

export async function createContext() {
  const session = await auth();
  return { session, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: { ...ctx, session: ctx.session },
  });
});

export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const orgId = ctx.session.user.orgId;
  if (!orgId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No organization selected",
    });
  }
  return next({
    ctx: { ...ctx, orgId, orgRole: ctx.session.user.orgRole },
  });
});

export const managerProcedure = orgProcedure.use(async ({ ctx, next }) => {
  if (!["OWNER", "MANAGER"].includes(ctx.orgRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
  }
  return next({ ctx });
});

export const ownerProcedure = orgProcedure.use(async ({ ctx, next }) => {
  if (ctx.orgRole !== "OWNER") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Owner access required" });
  }
  return next({ ctx });
});
