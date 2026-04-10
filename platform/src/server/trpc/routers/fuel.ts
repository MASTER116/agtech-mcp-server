import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

export const fuelRouter = router({
  // ── Записи ГСМ ──
  list: orgProcedure
    .input(z.object({
      equipmentId: z.string().optional(),
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.fuelRecord.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.equipmentId && { equipmentId: input.equipmentId }),
          ...(input?.from && { recordedAt: { gte: input.from } }),
          ...(input?.to && { recordedAt: { lte: input.to } }),
        },
        orderBy: { recordedAt: "desc" },
        take: 500,
      });
    }),

  create: orgProcedure
    .input(z.object({
      equipmentId: z.string(),
      activityId: z.string().optional(),
      type: z.enum(["refuel", "consumption"]),
      liters: z.number().positive(),
      costPerLiter: z.number().optional(),
      fuelType: z.string().default("diesel"),
      engineHours: z.number().optional(),
      odometer: z.number().optional(),
      location: z.string().optional(),
      operatorId: z.string().optional(),
      notes: z.string().optional(),
      recordedAt: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const totalCost = input.costPerLiter ? input.liters * input.costPerLiter : undefined;
      return ctx.db.fuelRecord.create({
        data: { ...input, orgId: ctx.orgId, totalCost },
      });
    }),

  // ── Сводка расхода ──
  summary: orgProcedure
    .input(z.object({ from: z.date(), to: z.date() }))
    .query(async ({ ctx, input }) => {
      const records = await ctx.db.fuelRecord.findMany({
        where: { orgId: ctx.orgId, recordedAt: { gte: input.from, lte: input.to } },
      });
      const totalLiters = records.reduce((s, r) => s + r.liters, 0);
      const totalCost = records.reduce((s, r) => s + (r.totalCost || 0), 0);
      const refueled = records.filter(r => r.type === "refuel").reduce((s, r) => s + r.liters, 0);
      const consumed = records.filter(r => r.type === "consumption").reduce((s, r) => s + r.liters, 0);
      return { totalLiters: Math.round(totalLiters), totalCost: Math.round(totalCost), refueled: Math.round(refueled), consumed: Math.round(consumed), recordCount: records.length };
    }),

  // ── Путевые листы ──
  waybills: orgProcedure
    .input(z.object({ status: z.string().optional(), from: z.date().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.waybill.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.status && { status: input.status }),
          ...(input?.from && { date: { gte: input.from } }),
        },
        orderBy: { date: "desc" },
        take: 100,
      });
    }),

  createWaybill: managerProcedure
    .input(z.object({
      equipmentId: z.string(),
      operatorId: z.string(),
      number: z.string(),
      date: z.date(),
      routeFrom: z.string().optional(),
      routeTo: z.string().optional(),
      fuelIssued: z.number().optional(),
      cargoDesc: z.string().optional(),
      cargoWeight: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.waybill.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  closeWaybill: orgProcedure
    .input(z.object({
      id: z.string(),
      returnTime: z.date(),
      distanceKm: z.number().optional(),
      fuelEnd: z.number().optional(),
      fuelConsumed: z.number().optional(),
      fuelNorm: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.waybill.update({ where: { id }, data: { ...data, status: "closed" } });
    }),
});
