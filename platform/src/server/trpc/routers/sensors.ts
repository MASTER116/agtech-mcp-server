import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

const sensorTypes = z.enum([
  "SOIL_MOISTURE", "SOIL_TEMPERATURE", "AIR_TEMPERATURE", "AIR_HUMIDITY",
  "RAINFALL", "WIND_SPEED", "FERTILIZER_DEPTH", "PH_METER", "LIGHT",
  "LEAF_WETNESS", "OTHER",
]);

export const sensorsRouter = router({
  list: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.sensor.findMany({
      where: { orgId: ctx.orgId },
      include: {
        field: { select: { id: true, name: true } },
        readings: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
    });
  }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sensor = await ctx.db.sensor.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: { field: true },
      });
      if (!sensor) throw new Error("Sensor not found");
      return sensor;
    }),

  getReadings: orgProcedure
    .input(
      z.object({
        sensorId: z.string(),
        from: z.date().optional(),
        to: z.date().optional(),
        limit: z.number().int().min(1).max(10000).default(500),
      })
    )
    .query(async ({ ctx, input }) => {
      const sensor = await ctx.db.sensor.findFirst({
        where: { id: input.sensorId, orgId: ctx.orgId },
      });
      if (!sensor) throw new Error("Sensor not found");

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      return ctx.db.sensorReading.findMany({
        where: {
          sensorId: input.sensorId,
          recordedAt: {
            gte: input.from || oneDayAgo,
            ...(input.to && { lte: input.to }),
          },
        },
        orderBy: { recordedAt: "asc" },
        take: input.limit,
      });
    }),

  register: managerProcedure
    .input(
      z.object({
        deviceId: z.string().min(1),
        name: z.string().min(1),
        type: sensorTypes,
        unit: z.string().min(1),
        fieldId: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sensor.create({
        data: { ...input, orgId: ctx.orgId },
      });
    }),

  update: managerProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        fieldId: z.string().nullable().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.sensor.update({
        where: { id, orgId: ctx.orgId },
        data,
      });
    }),

  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sensor.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
    }),
});
