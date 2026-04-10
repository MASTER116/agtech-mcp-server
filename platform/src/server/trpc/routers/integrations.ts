import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

export const integrationsRouter = router({
  // ═══ ФГИС «Зерно» ═══
  listGrainLots: orgProcedure
    .input(z.object({ year: z.number().optional(), status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.grainLot.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.year && { harvestYear: input.year }),
          ...(input?.status && { fgisStatus: input.status }),
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  createGrainLot: managerProcedure
    .input(z.object({
      fieldId: z.string().optional(),
      cropName: z.string(),
      harvestYear: z.number().int(),
      weightKg: z.number().positive(),
      qualityClass: z.string().optional(),
      moisture: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.grainLot.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  registerGrainLot: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Заглушка: в продакшне будет вызов API ФГИС «Зерно»
      const sdizNumber = `СДИЗ-${Date.now().toString(36).toUpperCase()}`;
      return ctx.db.grainLot.update({
        where: { id: input.id },
        data: { fgisStatus: "submitted", sdizNumber },
      });
    }),

  sellGrainLot: managerProcedure
    .input(z.object({
      id: z.string(),
      buyerName: z.string(),
      buyerInn: z.string().optional(),
      salePricePerTon: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const lot = await ctx.db.grainLot.findFirst({ where: { id: input.id, orgId: ctx.orgId } });
      if (!lot) throw new Error("Lot not found");
      const salePrice = (lot.weightKg / 1000) * input.salePricePerTon;
      return ctx.db.grainLot.update({
        where: { id: input.id },
        data: { ...input, salePrice, fgisStatus: "sold" },
      });
    }),

  // ═══ Синхронизация 1С ═══
  get1CSyncQueue: orgProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.syncQueue1C.findMany({
        where: { orgId: ctx.orgId, ...(input?.status && { status: input.status }) },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }),

  push1CSync: managerProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.string(),
      action: z.enum(["create", "update", "delete"]),
      payload: z.any(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.syncQueue1C.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  confirm1CSync: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.syncQueue1C.update({
        where: { id: input.id },
        data: { status: "confirmed", syncedAt: new Date() },
      });
    }),

  // ═══ Уведомления ═══
  listNotifications: orgProcedure
    .input(z.object({ unreadOnly: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.notification.findMany({
        where: {
          orgId: ctx.orgId,
          OR: [{ userId: ctx.session.user.id }, { userId: null }],
          ...(input?.unreadOnly && { read: false }),
        },
        orderBy: { sentAt: "desc" },
        take: 50,
      });
    }),

  markRead: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.notification.update({
        where: { id: input.id },
        data: { read: true, readAt: new Date() },
      });
    }),

  markAllRead: orgProcedure.mutation(async ({ ctx }) => {
    return ctx.db.notification.updateMany({
      where: { orgId: ctx.orgId, OR: [{ userId: ctx.session.user.id }, { userId: null }], read: false },
      data: { read: true, readAt: new Date() },
    });
  }),

  getUnreadCount: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.notification.count({
      where: { orgId: ctx.orgId, OR: [{ userId: ctx.session.user.id }, { userId: null }], read: false },
    });
  }),

  // ═══ Бюджет сезона ═══
  getBudget: orgProcedure
    .input(z.object({ year: z.number().int(), fieldId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.seasonBudget.findMany({
        where: { orgId: ctx.orgId, year: input.year, ...(input.fieldId ? { fieldId: input.fieldId } : {}) },
      });
    }),

  setBudgetLine: managerProcedure
    .input(z.object({
      year: z.number().int(),
      fieldId: z.string().optional(),
      category: z.string(),
      planned: z.number(),
      actual: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fieldId = input.fieldId || null;
      return ctx.db.seasonBudget.upsert({
        where: { orgId_year_fieldId_category: { orgId: ctx.orgId, year: input.year, fieldId: fieldId as string, category: input.category } },
        create: { ...input, fieldId, orgId: ctx.orgId },
        update: { planned: input.planned, actual: input.actual, notes: input.notes },
      });
    }),

  // ═══ Telegram привязка ═══
  getTelegramBinding: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.telegramBinding.findFirst({
      where: { orgId: ctx.orgId, userId: ctx.session.user.id },
    });
  }),

  bindTelegram: orgProcedure
    .input(z.object({ chatId: z.string(), username: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.telegramBinding.upsert({
        where: { chatId: input.chatId },
        create: { orgId: ctx.orgId, userId: ctx.session.user.id, chatId: input.chatId, username: input.username, isVerified: true },
        update: { isVerified: true, username: input.username },
      });
    }),
});
