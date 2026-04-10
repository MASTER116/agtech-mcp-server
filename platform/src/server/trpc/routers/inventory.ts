import { z } from "zod";
import { router, orgProcedure, managerProcedure } from "../trpc";

const categories = z.enum(["SEEDS", "FERTILIZER", "PESTICIDE", "FUEL", "SPARE_PARTS", "OTHER_MATERIAL"]);

export const inventoryRouter = router({
  listItems: orgProcedure
    .input(z.object({ category: categories.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const items = await ctx.db.inventoryItem.findMany({
        where: { orgId: ctx.orgId, ...(input?.category && { category: input.category }) },
        include: { movements: { orderBy: { recordedAt: "desc" }, take: 1 } },
        orderBy: { name: "asc" },
      });
      // Рассчитать текущий остаток для каждого
      const withBalance = await Promise.all(items.map(async (item) => {
        const movements = await ctx.db.inventoryMovement.findMany({ where: { itemId: item.id } });
        const balance = movements.reduce((s, m) => {
          if (m.type === "in") return s + m.quantity;
          if (m.type === "out") return s - m.quantity;
          return m.quantity; // adjustment
        }, 0);
        return { ...item, currentBalance: Math.round(balance * 100) / 100, isLow: item.minStock ? balance <= item.minStock : false };
      }));
      return withBalance;
    }),

  createItem: managerProcedure
    .input(z.object({
      name: z.string().min(1),
      category: categories,
      unit: z.string(),
      sku: z.string().optional(),
      minStock: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.inventoryItem.create({ data: { ...input, orgId: ctx.orgId } });
    }),

  addMovement: orgProcedure
    .input(z.object({
      itemId: z.string(),
      type: z.enum(["in", "out", "adjustment"]),
      quantity: z.number(),
      unitCost: z.number().optional(),
      supplierName: z.string().optional(),
      invoiceNo: z.string().optional(),
      activityId: z.string().optional(),
      notes: z.string().optional(),
      recordedAt: z.date(),
    }))
    .mutation(async ({ ctx, input }) => {
      const totalCost = input.unitCost ? input.quantity * input.unitCost : undefined;
      return ctx.db.inventoryMovement.create({ data: { ...input, totalCost } });
    }),

  getLowStock: orgProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.inventoryItem.findMany({
      where: { orgId: ctx.orgId, minStock: { not: null } },
      include: { movements: true },
    });
    return items
      .map((item) => {
        const balance = item.movements.reduce((s, m) => m.type === "in" ? s + m.quantity : m.type === "out" ? s - m.quantity : m.quantity, 0);
        return { ...item, currentBalance: balance, isLow: balance <= (item.minStock || 0) };
      })
      .filter((i) => i.isLow);
  }),
});
