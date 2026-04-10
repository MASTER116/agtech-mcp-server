import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

const activityTypes = z.enum([
  "PLOWING", "CULTIVATION", "SEEDING", "FERTILIZING", "SPRAYING",
  "IRRIGATION", "HARVESTING", "TRANSPORT", "SCOUTING", "SOIL_SAMPLING",
  "MAINTENANCE_TASK", "OTHER",
]);

const activityStatuses = z.enum([
  "PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "OVERDUE",
]);

export const activitiesRouter = router({
  list: orgProcedure
    .input(
      z.object({
        status: activityStatuses.optional(),
        type: activityTypes.optional(),
        fieldId: z.string().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.activity.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.status && { status: input.status }),
          ...(input?.type && { type: input.type }),
          ...(input?.fieldId && { fieldId: input.fieldId }),
          ...(input?.from && { plannedStartAt: { gte: input.from } }),
          ...(input?.to && { plannedEndAt: { lte: input.to } }),
        },
        include: {
          field: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          equipment: { include: { equipment: { select: { id: true, name: true, category: true } } } },
        },
        orderBy: { plannedStartAt: "asc" },
      });
    }),

  getById: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.activity.findFirst({
        where: { id: input.id, orgId: ctx.orgId },
        include: {
          field: true,
          assignedTo: true,
          equipment: { include: { equipment: true } },
        },
      });
      if (!activity) throw new Error("Activity not found");
      return activity;
    }),

  create: managerProcedure
    .input(
      z.object({
        type: activityTypes,
        title: z.string().min(1),
        description: z.string().optional(),
        fieldId: z.string().optional(),
        plannedStartAt: z.date(),
        plannedEndAt: z.date(),
        assignedToId: z.string().optional(),
        equipmentIds: z.array(z.string()).optional(),
        inputProduct: z.string().optional(),
        inputRateKgHa: z.number().optional(),
        inputTotalKg: z.number().optional(),
        estimatedCost: z.number().optional(),
        notes: z.string().optional(),
        weatherMinTemp: z.number().optional(),
        weatherMaxWind: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { equipmentIds, ...data } = input;
      const activity = await ctx.db.activity.create({
        data: { ...data, orgId: ctx.orgId },
      });
      if (equipmentIds?.length) {
        await ctx.db.activityEquipment.createMany({
          data: equipmentIds.map((equipmentId) => ({
            activityId: activity.id,
            equipmentId,
          })),
        });
      }
      return activity;
    }),

  updateStatus: orgProcedure
    .input(
      z.object({
        id: z.string(),
        status: activityStatuses,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const updateData: Record<string, unknown> = { status: input.status };
      if (input.status === "IN_PROGRESS") updateData.actualStartAt = now;
      if (input.status === "COMPLETED") updateData.actualEndAt = now;

      return ctx.db.activity.update({
        where: { id: input.id, orgId: ctx.orgId },
        data: updateData,
      });
    }),

  delete: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.activity.delete({
        where: { id: input.id, orgId: ctx.orgId },
      });
    }),
});
