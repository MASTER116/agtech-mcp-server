import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";
import { validateRotation, suggestCrops } from "@/lib/crop-rotation";
import { evaluateSprayWindow } from "@/lib/spray-calculator";

export const agronomyRouter = router({
  // ── Севооборот ──
  getRotationPlan: orgProcedure
    .input(z.object({ fieldId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.cropRotationPlan.findMany({
        where: { orgId: ctx.orgId, fieldId: input.fieldId },
        orderBy: { year: "desc" },
      });
    }),

  setRotationPlan: managerProcedure
    .input(z.object({
      fieldId: z.string(),
      year: z.number().int(),
      cropName: z.string(),
      variety: z.string().optional(),
      predecessor: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cropRotationPlan.upsert({
        where: { fieldId_year: { fieldId: input.fieldId, year: input.year } },
        create: { ...input, orgId: ctx.orgId },
        update: input,
      });
    }),

  validateRotation: orgProcedure
    .input(z.object({ fieldId: z.string(), crop: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await ctx.db.cropRotationPlan.findMany({
        where: { fieldId: input.fieldId },
        orderBy: { year: "desc" },
        take: 10,
      });
      const seasons = await ctx.db.cropSeason.findMany({
        where: { fieldId: input.fieldId },
        orderBy: { seasonYear: "desc" },
        take: 10,
      });
      const allHistory = [
        ...history.map(h => ({ year: h.year, crop: h.cropName })),
        ...seasons.map(s => ({ year: s.seasonYear, crop: s.cropName })),
      ];
      const predecessor = allHistory[0]?.crop || "";
      return validateRotation(input.crop, predecessor, allHistory);
    }),

  suggestCrops: orgProcedure
    .input(z.object({ fieldId: z.string() }))
    .query(async ({ ctx, input }) => {
      const history = await ctx.db.cropRotationPlan.findMany({
        where: { fieldId: input.fieldId },
        orderBy: { year: "desc" },
        take: 10,
      });
      const seasons = await ctx.db.cropSeason.findMany({
        where: { fieldId: input.fieldId },
        orderBy: { seasonYear: "desc" },
        take: 10,
      });
      const allHistory = [
        ...history.map(h => ({ year: h.year, crop: h.cropName })),
        ...seasons.map(s => ({ year: s.seasonYear, crop: s.cropName })),
      ];
      const predecessor = allHistory[0]?.crop || "";
      return suggestCrops(predecessor, allHistory);
    }),

  // ── Качество урожая ──
  addQualitySample: managerProcedure
    .input(z.object({
      fieldId: z.string(),
      cropSeasonId: z.string().optional(),
      sampleDate: z.date(),
      moisture: z.number().optional(),
      impurity: z.number().optional(),
      gluten: z.number().optional(),
      protein: z.number().optional(),
      oilContent: z.number().optional(),
      testWeight: z.number().optional(),
      gradeClass: z.string().optional(),
      fallingNumber: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.harvestQuality.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  getQualitySamples: orgProcedure
    .input(z.object({ fieldId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.harvestQuality.findMany({
        where: { orgId: ctx.orgId, fieldId: input.fieldId },
        orderBy: { sampleDate: "desc" },
      });
    }),

  // ── Журнал СЗР ──
  addPesticideRecord: managerProcedure
    .input(z.object({
      fieldId: z.string(),
      activityId: z.string().optional(),
      date: z.date(),
      productName: z.string(),
      activeIngredient: z.string().optional(),
      regNumber: z.string().optional(),
      applicationRate: z.number(),
      areaHa: z.number(),
      totalUsed: z.number(),
      targetPest: z.string().optional(),
      method: z.string().optional(),
      weatherTemp: z.number().optional(),
      weatherWind: z.number().optional(),
      operatorId: z.string().optional(),
      waitingPeriod: z.number().int().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.pesticideJournal.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  getPesticideJournal: orgProcedure
    .input(z.object({ fieldId: z.string().optional(), year: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const yearStart = input?.year ? new Date(`${input.year}-01-01`) : undefined;
      const yearEnd = input?.year ? new Date(`${input.year}-12-31`) : undefined;
      return ctx.db.pesticideJournal.findMany({
        where: {
          orgId: ctx.orgId,
          ...(input?.fieldId && { fieldId: input.fieldId }),
          ...(yearStart && { date: { gte: yearStart, lte: yearEnd } }),
        },
        orderBy: { date: "desc" },
      });
    }),

  // ── Калькулятор опрыскивания ──
  evaluateSprayWindow: orgProcedure
    .input(z.object({
      temperature: z.number(),
      windSpeed: z.number(),
      humidity: z.number(),
      precipitationMm: z.number(),
      hour: z.number().int().min(0).max(23),
    }))
    .query(({ input }) => {
      return evaluateSprayWindow(input);
    }),
});
