import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

export const fleetRouter = router({
  list: orgProcedure
    .input(
      z.object({
        status: z.enum(["ACTIVE", "IDLE", "MAINTENANCE", "DECOMMISSIONED"]).optional(),
        category: z.enum(["TRACTOR", "GRAIN_COMBINE", "FORAGE_COMBINE", "SPRAYER", "SEEDER", "CULTIVATOR", "PLOW", "HARROW", "TRUCK", "TRAILER", "GRAIN_DRYER", "FERTILIZER_SPREADER", "LOADER", "BULLDOZER", "DRONE", "OTHER"]).optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.equipment.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.status && { status: input.status }),
          ...(input?.category && { category: input.category }),
          ...(input?.search && {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { make: { contains: input.search, mode: "insensitive" } },
              { model: { contains: input.search, mode: "insensitive" } },
            ],
          }),
        },
        orderBy: { updatedAt: "desc" },
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const eq = await ctx.db.equipment.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          maintenance: { orderBy: { createdAt: "desc" }, take: 5 },
          activities: {
            include: { activity: true },
            orderBy: { activity: { plannedStartAt: "desc" } },
            take: 10,
          },
        },
      });
      if (!eq) throw new Error("Equipment not found");
      return eq;
    }),

  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.enum(["TRACTOR", "GRAIN_COMBINE", "FORAGE_COMBINE", "SPRAYER", "SEEDER", "CULTIVATOR", "PLOW", "HARROW", "TRUCK", "TRAILER", "GRAIN_DRYER", "FERTILIZER_SPREADER", "LOADER", "BULLDOZER", "DRONE", "OTHER"]),
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.number().int().optional(),
        serialNumber: z.string().optional(),
        registrationNo: z.string().optional(),
        fuelType: z.string().optional(),
        engineHours: z.number().optional(),
        purchasePrice: z.number().optional(),
        notes: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.equipment.create({
        data: { ...input, orgId: ctx.orgId },
      });
    }),

  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        category: z.enum(["TRACTOR", "GRAIN_COMBINE", "FORAGE_COMBINE", "SPRAYER", "SEEDER", "CULTIVATOR", "PLOW", "HARROW", "TRUCK", "TRAILER", "GRAIN_DRYER", "FERTILIZER_SPREADER", "LOADER", "BULLDOZER", "DRONE", "OTHER"]).optional(),
        status: z.enum(["ACTIVE", "IDLE", "MAINTENANCE", "DECOMMISSIONED"]).optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.number().int().optional(),
        serialNumber: z.string().optional(),
        registrationNo: z.string().optional(),
        fuelType: z.string().optional(),
        engineHours: z.number().optional(),
        purchasePrice: z.number().optional(),
        notes: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.equipment.update({
        where: { id, orgId: ctx.orgId },
        data,
      });
    }),

  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.equipment.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
    }),

  getPositionHistory: orgProcedure
    .input(
      z.object({
        equipmentId: z.string(),
        from: z.date().optional(),
        to: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const eq = await ctx.db.equipment.findFirst({
        where: { id: input.equipmentId, orgId: ctx.orgId },
      });
      if (!eq) throw new Error("Equipment not found");

      return ctx.db.equipmentPosition.findMany({
        where: {
          equipmentId: input.equipmentId,
          ...(input.from && { recordedAt: { gte: input.from } }),
          ...(input.to && { recordedAt: { lte: input.to } }),
        },
        orderBy: { recordedAt: "desc" },
        take: 1000,
      });
    }),
});
