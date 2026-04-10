import { z } from "zod";
import { router, orgProcedure, managerProcedure, publicProcedure } from "../trpc";

const listingTypes = z.enum(["RENTAL", "SERVICE", "SALE"]);
const listingStatuses = z.enum(["DRAFT", "ACTIVE", "RESERVED", "COMPLETED", "CANCELLED"]);

export const marketplaceRouter = router({
  listPublic: publicProcedure
    .input(
      z.object({
        type: listingTypes.optional(),
        search: z.string().optional(),
        lat: z.number().optional(),
        lon: z.number().optional(),
        radiusKm: z.number().optional(),
        from: z.date().optional(),
        to: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.marketplaceListing.findMany({
        where: {
          status: "ACTIVE",
          ...(input?.type && { type: input.type }),
          ...(input?.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }),
          ...(input?.from && { availableTo: { gte: input.from } }),
          ...(input?.to && { availableFrom: { lte: input.to } }),
        },
        include: {
          org: { select: { name: true, slug: true } },
          equipment: { select: { name: true, category: true, make: true, model: true, year: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  myListings: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.marketplaceListing.findMany({
      where: { orgId: ctx.orgId },
      include: {
        equipment: { select: { name: true, category: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.db.marketplaceListing.findUnique({
        where: { id: input.id },
        include: {
          org: { select: { name: true, slug: true } },
          equipment: true,
          bookings: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      });
      if (!listing) throw new Error("Listing not found");
      return listing;
    }),

  create: managerProcedure
    .input(
      z.object({
        type: listingTypes,
        title: z.string().min(1),
        description: z.string().optional(),
        equipmentId: z.string().optional(),
        pricePerDay: z.number().optional(),
        pricePerHour: z.number().optional(),
        pricePerHa: z.number().optional(),
        availableFrom: z.date(),
        availableTo: z.date(),
        regionName: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        radiusKm: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.marketplaceListing.create({
        data: { ...input, orgId: ctx.orgId },
      });
    }),

  publish: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.marketplaceListing.update({
        where: { id: input.id, orgId: ctx.orgId },
        data: { status: "ACTIVE" },
      });
    }),

  book: orgProcedure
    .input(
      z.object({
        listingId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.marketplaceListing.findUnique({
        where: { id: input.listingId },
      });
      if (!listing || listing.status !== "ACTIVE") {
        throw new Error("Listing not available");
      }

      const days = Math.ceil(
        (input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalPrice = (listing.pricePerDay || 0) * days;

      return ctx.db.marketplaceBooking.create({
        data: {
          listingId: input.listingId,
          renterOrgId: ctx.orgId,
          startDate: input.startDate,
          endDate: input.endDate,
          totalPrice,
          notes: input.notes,
        },
      });
    }),

  getSuggestedPrice: orgProcedure
    .input(
      z.object({
        category: z.enum(["TRACTOR", "GRAIN_COMBINE", "FORAGE_COMBINE", "SPRAYER", "SEEDER", "CULTIVATOR", "PLOW", "HARROW", "TRUCK", "TRAILER", "GRAIN_DRYER", "FERTILIZER_SPREADER", "LOADER", "BULLDOZER", "DRONE", "OTHER"]),
        type: listingTypes,
      })
    )
    .query(async ({ ctx, input }) => {
      const listings = await ctx.db.marketplaceListing.findMany({
        where: {
          status: "ACTIVE",
          type: input.type,
          equipment: { category: input.category },
        },
        select: { pricePerDay: true, pricePerHour: true, pricePerHa: true },
      });

      if (listings.length === 0) {
        return { pricePerDay: null, pricePerHour: null, pricePerHa: null, sampleSize: 0 };
      }

      const median = (arr: number[]) => {
        const sorted = arr.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      };

      const dayPrices = listings.map((l) => l.pricePerDay).filter((p): p is number => p != null);
      const hourPrices = listings.map((l) => l.pricePerHour).filter((p): p is number => p != null);
      const haPrices = listings.map((l) => l.pricePerHa).filter((p): p is number => p != null);

      return {
        pricePerDay: dayPrices.length ? Math.round(median(dayPrices)) : null,
        pricePerHour: hourPrices.length ? Math.round(median(hourPrices)) : null,
        pricePerHa: haPrices.length ? Math.round(median(haPrices)) : null,
        sampleSize: listings.length,
      };
    }),
});
