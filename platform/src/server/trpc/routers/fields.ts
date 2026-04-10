import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

export const fieldsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.field.findMany({
      where: { orgId: ctx.orgId },
      include: {
        cropSeasons: {
          orderBy: { seasonYear: "desc" },
          take: 1,
        },
        _count: { select: { sensors: true, activities: true } },
      },
      orderBy: { name: "asc" },
    });
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const field = await ctx.db.field.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          cropSeasons: { orderBy: { seasonYear: "desc" } },
          sensors: true,
          activities: {
            orderBy: { plannedStartAt: "desc" },
            take: 10,
            include: { equipment: { include: { equipment: true } } },
          },
        },
      });
      if (!field) throw new Error("Field not found");
      return field;
    }),

  create: managerProcedure
    .input(
      z.object({
        name: z.string().min(1),
        areaHa: z.number().positive(),
        boundary: z.any(), // GeoJSON Polygon
        centerLat: z.number(),
        centerLon: z.number(),
        soilType: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.field.create({
        data: { ...input, orgId: ctx.orgId },
      });
    }),

  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        areaHa: z.number().positive().optional(),
        boundary: z.any().optional(),
        centerLat: z.number().optional(),
        centerLon: z.number().optional(),
        soilType: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.field.update({
        where: { id, orgId: ctx.orgId },
        data,
      });
    }),

  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.field.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
    }),

  addCropSeason: managerProcedure
    .input(
      z.object({
        fieldId: z.string(),
        cropName: z.string().min(1),
        variety: z.string().optional(),
        seasonYear: z.number().int(),
        plantedAt: z.date().optional(),
        expectedYieldKgHa: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const field = await ctx.db.field.findFirst({
        where: { id: input.fieldId, orgId: ctx.orgId },
      });
      if (!field) throw new Error("Field not found");
      return ctx.db.cropSeason.create({ data: input });
    }),
});
