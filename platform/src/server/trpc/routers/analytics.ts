import { router, orgProcedure } from "../trpc";
import { z } from "zod";

export const analyticsRouter = router({
  getDashboardStats: orgProcedure.query(async ({ ctx }) => {
    const [
      equipmentCounts,
      fieldCount,
      activitiesByStatus,
      sensorCount,
      upcomingActivities,
      recentActivities,
    ] = await Promise.all([
      ctx.db.equipment.groupBy({
        by: ["status"],
        where: { orgId: ctx.orgId },
        _count: true,
      }),
      ctx.db.field.count({ where: { orgId: ctx.orgId } }),
      ctx.db.activity.groupBy({
        by: ["status"],
        where: { orgId: ctx.orgId },
        _count: true,
      }),
      ctx.db.sensor.count({ where: { orgId: ctx.orgId } }),
      ctx.db.activity.findMany({
        where: {
          orgId: ctx.orgId,
          status: "PLANNED",
          plannedStartAt: { gte: new Date() },
        },
        include: {
          field: { select: { name: true } },
          equipment: { include: { equipment: { select: { name: true } } } },
        },
        orderBy: { plannedStartAt: "asc" },
        take: 5,
      }),
      ctx.db.activity.findMany({
        where: { orgId: ctx.orgId, status: "COMPLETED" },
        include: { field: { select: { name: true } } },
        orderBy: { actualEndAt: "desc" },
        take: 5,
      }),
    ]);

    const equipment = {
      total: equipmentCounts.reduce((sum, g) => sum + g._count, 0),
      active: equipmentCounts.find((g) => g.status === "ACTIVE")?._count || 0,
      idle: equipmentCounts.find((g) => g.status === "IDLE")?._count || 0,
      maintenance: equipmentCounts.find((g) => g.status === "MAINTENANCE")?._count || 0,
    };

    const activities = {
      planned: activitiesByStatus.find((g) => g.status === "PLANNED")?._count || 0,
      inProgress: activitiesByStatus.find((g) => g.status === "IN_PROGRESS")?._count || 0,
      completed: activitiesByStatus.find((g) => g.status === "COMPLETED")?._count || 0,
    };

    return {
      equipment,
      fieldCount,
      activities,
      sensorCount,
      upcomingActivities,
      recentActivities,
    };
  }),

  getEquipmentUtilization: orgProcedure
    .input(z.object({ days: z.number().int().default(30) }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days);

      const equipment = await ctx.db.equipment.findMany({
        where: { orgId: ctx.orgId, status: { not: "DECOMMISSIONED" } },
        include: {
          activities: {
            include: {
              activity: {
                select: {
                  plannedStartAt: true,
                  plannedEndAt: true,
                  actualStartAt: true,
                  actualEndAt: true,
                  status: true,
                },
              },
            },
            where: {
              activity: { plannedStartAt: { gte: since } },
            },
          },
        },
      });

      return equipment.map((eq) => {
        const totalHours = input.days * 24;
        const busyHours = eq.activities.reduce((sum, ae) => {
          const start = ae.activity.actualStartAt || ae.activity.plannedStartAt;
          const end = ae.activity.actualEndAt || ae.activity.plannedEndAt;
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0);

        return {
          id: eq.id,
          name: eq.name,
          category: eq.category,
          utilizationPct: Math.min(100, Math.round((busyHours / totalHours) * 100)),
          busyHours: Math.round(busyHours),
          totalActivities: eq.activities.length,
        };
      });
    }),
});
