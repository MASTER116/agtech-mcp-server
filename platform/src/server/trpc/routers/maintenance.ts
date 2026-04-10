import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

const maintenanceTypes = z.enum(["SCHEDULED", "UNSCHEDULED", "EMERGENCY", "INSPECTION"]);

export const maintenanceRouter = router({
  list: orgProcedure
    .input(
      z.object({
        equipmentId: z.string().optional(),
        upcoming: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.maintenanceRecord.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.equipmentId && { equipmentId: input.equipmentId }),
          ...(input?.upcoming && {
            completedAt: null,
            scheduledAt: { gte: new Date() },
          }),
        },
        include: {
          equipment: { select: { id: true, name: true, category: true } },
        },
        orderBy: { scheduledAt: "asc" },
      });
    }),

  create: managerProcedure
    .input(
      z.object({
        equipmentId: z.string(),
        type: maintenanceTypes,
        title: z.string().min(1),
        description: z.string().optional(),
        scheduledAt: z.date().optional(),
        cost: z.number().optional(),
        engineHoursAtService: z.number().optional(),
        nextServiceAt: z.date().optional(),
        nextServiceHours: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.maintenanceRecord.create({
        data: { ...input, orgId: ctx.orgId },
      });
    }),

  complete: managerProcedure
    .input(
      z.object({
        id: z.string(),
        cost: z.number().optional(),
        partsUsed: z.any().optional(),
        engineHoursAtService: z.number().optional(),
        nextServiceAt: z.date().optional(),
        nextServiceHours: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.maintenanceRecord.update({
        where: { id, orgId: ctx.orgId },
        data: { ...data, completedAt: new Date() },
      });
    }),

  getUpcoming: orgProcedure.query(async ({ ctx }) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return ctx.db.maintenanceRecord.findMany({
      where: {
        orgId: ctx.orgId,
        completedAt: null,
        scheduledAt: { lte: thirtyDaysFromNow },
      },
      include: {
        equipment: { select: { id: true, name: true, category: true, engineHours: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    });
  }),
});
