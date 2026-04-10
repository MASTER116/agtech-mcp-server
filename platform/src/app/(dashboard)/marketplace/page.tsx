"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Plus, ShoppingCart, Tag, Star, Sparkles, TrendingUp, Tractor, Wrench, HandHelping, Wheat } from "lucide-react";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useState } from "react";

const LISTING_TYPES = {
  RENTAL: { label: "Аренда", color: "#3b82f6" },
  SERVICE: { label: "Услуга", color: "#8b5cf6" },
  SALE: { label: "Продажа", color: "#f59e0b" },
} as const;

const CROP_EQUIPMENT_NEEDS: Record<string, { categories: string[]; harvestMonths: number[] }> = {
  "Пшеница озимая":  { categories: ["GRAIN_COMBINE"], harvestMonths: [6, 7] },
  "Пшеница яровая":  { categories: ["GRAIN_COMBINE"], harvestMonths: [7, 8] },
  "Ячмень яровой":   { categories: ["GRAIN_COMBINE"], harvestMonths: [7, 8] },
  "Кукуруза":        { categories: ["GRAIN_COMBINE"], harvestMonths: [9, 10] },
  "Подсолнечник":    { categories: ["GRAIN_COMBINE"], harvestMonths: [8, 9] },
  "Сахарная свёкла": { categories: ["LOADER", "TRUCK"], harvestMonths: [9, 10, 11] },
  "Соя":             { categories: ["GRAIN_COMBINE"], harvestMonths: [9, 10] },
  "Рапс":            { categories: ["GRAIN_COMBINE"], harvestMonths: [7, 8] },
  "Горох":           { categories: ["GRAIN_COMBINE"], harvestMonths: [7, 8] },
};

const RECOMMENDED_CROPS_FOR_ANALYTICS = ["Кукуруза", "Горох", "Рапс", "Соя"];

// ═══════════════════════════════════════════════
// РАЗДЕЛЫ МАРКЕТПЛЕЙСА
// ═══════════════════════════════════════════════

type Section = "all" | "rental" | "services" | "maintenance" | "equipment" | "farm";

const SECTIONS: { key: Section; label: string; icon: any; description: string }[] = [
  { key: "all", label: "Все", icon: ShoppingCart, description: "Все объявления" },
  { key: "rental", label: "Аренда техники", icon: Tractor, description: "Тракторы, комбайны, опрыскиватели — в аренду" },
  { key: "services", label: "Услуги", icon: HandHelping, description: "Опрыскивание, уборка, транспортировка и другие услуги" },
  { key: "maintenance", label: "Обслуживание", icon: Wrench, description: "Ремонт, ТО, диагностика, запчасти" },
  { key: "equipment", label: "Техника и оборудование", icon: Tractor, description: "Покупка / продажа техники и оборудования" },
  { key: "farm", label: "Хозяйственные", icon: Wheat, description: "Семена, удобрения, СЗР, зерно, корма" },
];

/** Классификация по секциям */
function getSection(listing: any): Section {
  if (listing.type === "SERVICE") {
    // Проверяем — обслуживание или общие услуги
    const title = (listing.title || "").toLowerCase();
    if (title.includes("ремонт") || title.includes("то ") || title.includes("обслужив") || title.includes("диагност") || title.includes("запчаст")) {
      return "maintenance";
    }
    return "services";
  }
  if (listing.type === "SALE") {
    const category = listing.equipment?.category || "";
    // Хозяйственные — если в описании семена/удобрения/корма
    const desc = ((listing.title || "") + (listing.description || "")).toLowerCase();
    if (desc.includes("семен") || desc.includes("удобрен") || desc.includes("корм") || desc.includes("зерно") || desc.includes("сзр") || desc.includes("пестицид")) {
      return "farm";
    }
    return "equipment";
  }
  // RENTAL
  return "rental";
}

type Relevance = "own" | "analytics" | "operational" | "other";

function classifyListing(listing: any, userOrgId: string, userCrops: string[]): { relevance: Relevance; reason: string } {
  if (listing.orgId === userOrgId) return { relevance: "own", reason: "Ваше объявление" };

  const category = listing.equipment?.category;
  const availFrom = new Date(listing.availableFrom);
  const availTo = new Date(listing.availableTo);
  const availMonths: number[] = [];
  for (let m = availFrom.getMonth(); m <= availTo.getMonth() + (availTo.getFullYear() - availFrom.getFullYear()) * 12; m++) {
    availMonths.push(m % 12 + 1);
  }

  for (const crop of RECOMMENDED_CROPS_FOR_ANALYTICS) {
    const needs = CROP_EQUIPMENT_NEEDS[crop];
    if (!needs) continue;
    if (category && needs.categories.includes(category)) {
      const monthOverlap = needs.harvestMonths.some(m => availMonths.includes(m));
      if (monthOverlap) {
        const monthNames = needs.harvestMonths.map(m => ["", "янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"][m]).join("-");
        return { relevance: "analytics", reason: `Аналитика: подходит для уборки ${crop} (${monthNames})` };
      }
    }
    if (listing.type === "SERVICE") {
      const title = (listing.title || "").toLowerCase();
      if (title.includes("опрыскив") || title.includes("удобрен") || title.includes("обработк")) {
        return { relevance: "analytics", reason: `Аналитика: услуга пригодится для ${crop}` };
      }
    }
  }

  for (const crop of userCrops) {
    const needs = CROP_EQUIPMENT_NEEDS[crop];
    if (!needs) continue;
    if (category && needs.categories.includes(category)) {
      const monthOverlap = needs.harvestMonths.some(m => availMonths.includes(m));
      if (monthOverlap) return { relevance: "operational", reason: `Подходит для уборки вашего ${crop}` };
    }
  }

  if (listing.type === "SERVICE") return { relevance: "operational", reason: "Услуга для хозяйства" };
  return { relevance: "other", reason: "" };
}

export default function MarketplacePage() {
  const { data: session } = useSession();
  const { data: listings, isLoading } = trpc.marketplace.listPublic.useQuery();
  const { data: fields } = trpc.fields.list.useQuery();
  const [activeSection, setActiveSection] = useState<Section>("all");

  const userOrgId = session?.user?.orgId || "";
  const userCrops = fields?.flatMap((f: any) => f.cropSeasons?.map((cs: any) => cs.cropName) || []).filter((v: any, i: any, a: any) => a.indexOf(v) === i) || [];

  const classified = listings?.map((listing: any) => ({
    listing,
    section: getSection(listing),
    ...classifyListing(listing, userOrgId, userCrops),
  })).sort((a, b) => {
    const order: Record<Relevance, number> = { own: 0, analytics: 1, operational: 2, other: 3 };
    return order[a.relevance] - order[b.relevance];
  }) || [];

  const filtered = activeSection === "all" ? classified : classified.filter(c => c.section === activeSection);

  // Счётчики по секциям
  const counts = SECTIONS.reduce((acc, s) => {
    acc[s.key] = s.key === "all" ? classified.length : classified.filter(c => c.section === s.key).length;
    return acc;
  }, {} as Record<Section, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Маркетплейс</h1>
        <div className="flex gap-2">
          <Link href="/marketplace/my" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700">Мои объявления</Link>
          <Link href="/marketplace/new" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
            <Plus className="h-4 w-4" /> Разместить
          </Link>
        </div>
      </div>

      {/* Разделы */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors ${
              activeSection === key
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {counts[key] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeSection === key ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Описание секции */}
      {activeSection !== "all" && (
        <p className="text-sm text-gray-500">
          {SECTIONS.find(s => s.key === activeSection)?.description}
        </p>
      )}

      {/* Легенда */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-orange-400 bg-orange-50" /> Рекомендация аналитики</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-green-500 bg-green-50" /> Подходит под ваши работы</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border-2 border-blue-400 bg-blue-50" /> Ваше объявление</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-72 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>{activeSection === "all" ? "Объявлений пока нет" : `Нет объявлений в разделе «${SECTIONS.find(s => s.key === activeSection)?.label}»`}</p>
          <Link href="/marketplace/new" className="text-green-600 text-sm mt-2 inline-block">Разместить объявление</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ listing, relevance, reason }: any) => {
            const lType = LISTING_TYPES[listing.type as keyof typeof LISTING_TYPES];
            const eqCategory = listing.equipment?.category
              ? EQUIPMENT_CATEGORIES[listing.equipment.category as keyof typeof EQUIPMENT_CATEGORIES]
              : null;
            const price = listing.pricePerDay || listing.pricePerHour || listing.pricePerHa;
            const priceUnit = listing.pricePerDay ? "/день" : listing.pricePerHour ? "/час" : "/га";

            const styles: Record<Relevance, { border: string; badge: string; Icon: any }> = {
              own:         { border: "border-2 border-blue-400 ring-1 ring-blue-100",     badge: "bg-blue-50 text-blue-700",     Icon: Star },
              analytics:   { border: "border-2 border-orange-400 ring-1 ring-orange-100", badge: "bg-orange-50 text-orange-700", Icon: TrendingUp },
              operational: { border: "border-2 border-green-500 ring-1 ring-green-100",   badge: "bg-green-50 text-green-700",   Icon: Sparkles },
              other:       { border: "border border-gray-200",                             badge: "",                              Icon: null },
            };
            const style = styles[relevance as Relevance];

            return (
              <Link key={listing.id} href={`/marketplace/${listing.id}`} className={`bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col ${style.border}`}>
                <div className="h-1.5" style={{ backgroundColor: lType?.color }} />

                {relevance !== "other" && (
                  <div className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${style.badge}`}>
                    {style.Icon && <style.Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                    <span className="truncate">{relevance === "own" ? "Ваше объявление" : reason}</span>
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 h-6 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ backgroundColor: lType?.color + "15", color: lType?.color }}>{lType?.label}</span>
                    {eqCategory && <span className="text-xs text-gray-500 truncate">{eqCategory.label}</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem] leading-6">{listing.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem] leading-5 mt-1">{listing.description || "Нет описания"}</p>
                  <div className="mt-3 h-8 flex items-center">
                    {price ? (
                      <div className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-gray-400" />
                        <span className="font-bold text-lg text-gray-900">{price.toLocaleString("ru-RU")} ₽</span>
                        <span className="text-xs text-gray-400">{priceUnit}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Цена договорная</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-400">
                    <span className="truncate max-w-[120px]">{listing.org.name}</span>
                    <span className="whitespace-nowrap">{formatDate(listing.availableFrom)} — {formatDate(listing.availableTo)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
