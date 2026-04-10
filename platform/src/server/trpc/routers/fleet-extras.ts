import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";
import { generateHealthReport } from "@/lib/predictive-analytics";

export const fleetExtrasRouter = router({
  // ── Геозоны ──
  listGeofences: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.geofence.findMany({ where: { orgId: ctx.orgId }, orderBy: { name: "asc" } });
  }),

  createGeofence: managerProcedure
    .input(z.object({
      name: z.string().min(1),
      boundary: z.any(),
      type: z.enum(["allowed", "restricted"]).default("allowed"),
      alertOnExit: z.boolean().default(true),
      alertOnEntry: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.geofence.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  getGeofenceAlerts: orgProcedure
    .input(z.object({ acknowledged: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.geofenceAlert.findMany({
        where: { orgId: ctx.orgId, ...(input?.acknowledged !== undefined && { acknowledged: input.acknowledged }) },
        orderBy: { triggeredAt: "desc" },
        take: 50,
      });
    }),

  acknowledgeAlert: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.geofenceAlert.update({ where: { id: input.id }, data: { acknowledged: true } });
    }),

  // ── Журнал операторов ──
  listOperatorLogs: orgProcedure
    .input(z.object({
      operatorId: z.string().optional(),
      equipmentId: z.string().optional(),
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.operatorLog.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.operatorId && { operatorId: input.operatorId }),
          ...(input?.equipmentId && { equipmentId: input.equipmentId }),
          ...(input?.from && { shiftDate: { gte: input.from } }),
          ...(input?.to && { shiftDate: { lte: input.to } }),
        },
        orderBy: { shiftDate: "desc" },
        take: 200,
      });
    }),

  createOperatorLog: orgProcedure
    .input(z.object({
      operatorId: z.string(),
      equipmentId: z.string(),
      activityId: z.string().optional(),
      shiftDate: z.date(),
      startTime: z.date(),
      endTime: z.date().optional(),
      hoursWorked: z.number().optional(),
      areaWorked: z.number().optional(),
      fuelUsed: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.operatorLog.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  // ── Учёт шин ──
  listTires: orgProcedure
    .input(z.object({ equipmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.tireRecord.findMany({
        where: { orgId: ctx.orgId, equipmentId: input.equipmentId },
        orderBy: { installedAt: "desc" },
      });
    }),

  addTire: managerProcedure
    .input(z.object({
      equipmentId: z.string(),
      position: z.string(),
      brand: z.string(),
      model: z.string(),
      size: z.string(),
      installedAt: z.date(),
      hoursAtInstall: z.number().optional(),
      costRub: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tireRecord.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  removeTire: managerProcedure
    .input(z.object({
      id: z.string(),
      removedAt: z.date(),
      hoursAtRemoval: z.number().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.tireRecord.update({ where: { id }, data });
    }),

  // ── Страховка ──
  listInsurance: orgProcedure
    .input(z.object({ equipmentId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.insurancePolicy.findMany({
        where: { orgId: ctx.orgId, ...(input?.equipmentId && { equipmentId: input.equipmentId }) },
        orderBy: { endDate: "asc" },
      });
    }),

  getExpiringInsurance: orgProcedure.query(async ({ ctx }) => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86_400_000);
    return ctx.db.insurancePolicy.findMany({
      where: { orgId: ctx.orgId, endDate: { lte: thirtyDaysFromNow } },
      orderBy: { endDate: "asc" },
    });
  }),

  addInsurance: managerProcedure
    .input(z.object({
      equipmentId: z.string(),
      policyNo: z.string(),
      insurer: z.string(),
      type: z.string(),
      premium: z.number(),
      coverage: z.number().optional(),
      startDate: z.date(),
      endDate: z.date(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.insurancePolicy.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  // ── Предиктивная аналитика здоровья ──
  getHealthReport: orgProcedure
    .input(z.object({
      equipmentId: z.string(),
      modelId: z.string().optional(),
      regionId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const eq = await ctx.db.equipment.findFirst({
        where: { id: input.equipmentId, orgId: ctx.orgId },
      });
      if (!eq) throw new Error("Equipment not found");

      const modelId = input.modelId || `${eq.make?.toLowerCase()}-${eq.model?.toLowerCase().replace(/\s/g, "-")}`;
      const currentHours = eq.engineHours || 0;

      // Вычисляем среднюю наработку в день
      const logs = await ctx.db.operatorLog.findMany({
        where: { equipmentId: input.equipmentId },
        orderBy: { shiftDate: "desc" },
        take: 30,
      });
      const avgHoursPerDay = logs.length > 0
        ? logs.reduce((s, l) => s + (l.hoursWorked || 0), 0) / Math.max(logs.length, 1)
        : 8;

      return generateHealthReport(modelId, currentHours, avgHoursPerDay, input.regionId);
    }),
});
