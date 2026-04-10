"use client";

import { trpc } from "@/lib/trpc";
import { recommendCrops, WORLD_FACTORS_2026, type FarmContext } from "@/lib/crop-advisor";
import { TrendingUp, AlertTriangle, Globe, Leaf, DollarSign, Thermometer, Droplets, ExternalLink } from "lucide-react";
import { useMemo } from "react";

export default function AdvisorPage() {
  const { data: fields } = trpc.fields.list.useQuery();
  const { data: equipment } = trpc.fleet.list.useQuery();

  const recommendations = useMemo(() => {
    if (!fields || !equipment) return [];

    const currentCrops = fields.flatMap((f: any) =>
      f.cropSeasons?.map((cs: any) => cs.cropName) || []
    ).filter((v: any, i: any, a: any) => a.indexOf(v) === i);

    const soilTypes = fields.map((f: any) => f.soilType).filter(Boolean);
    const eqCategories = equipment.map((e: any) => e.category).filter((v: any, i: any, a: any) => a.indexOf(v) === i);
    const totalArea = fields.reduce((s: number, f: any) => s + f.areaHa, 0);

    const ctx: FarmContext = {
      regionId: "krasnodar",
      avgTemp: { summer: 26, winter: 3 },
      avgPrecipitationMm: 600,
      soilTypes: soilTypes.length ? soilTypes : ["Чернозём обыкновенный"],
      currentCrops,
      areaHa: totalArea || 845,
      equipmentCategories: eqCategories,
    };

    return recommendCrops(ctx);
  }, [fields, equipment]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Советник по культурам</h1>
        <p className="text-sm text-gray-500 mt-1">
          Рекомендации новых прибыльных культур на основе вашего климата, почв, техники и мировой конъюнктуры
        </p>
      </div>

      {/* Мировые факторы */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-5">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5" /> Мировые факторы (влияют на рекомендации)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {WORLD_FACTORS_2026.map((factor) => (
            <div key={factor.id} className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${factor.impact === "positive" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {factor.impact === "positive" ? "+" : "-"}
                </span>
                <span className="text-sm font-medium text-gray-900">{factor.title}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Рекомендации */}
      {recommendations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Загрузка данных...</div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={rec.crop.id}
              className={`bg-white rounded-lg border overflow-hidden ${idx === 0 ? "border-green-400 ring-2 ring-green-100" : "border-gray-200"}`}
            >
              {/* Шапка с рейтингом */}
              <div className={`flex items-center justify-between px-5 py-3 ${idx === 0 ? "bg-green-50" : "bg-gray-50"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    rec.score >= 80 ? "bg-green-100 text-green-700" :
                    rec.score >= 60 ? "bg-amber-100 text-amber-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {rec.score}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{rec.crop.name}</h3>
                    <p className="text-xs text-gray-500">
                      {rec.crop.worldTrend === "rising" ? "Цены растут" : rec.crop.worldTrend === "stable" ? "Стабильные цены" : "Цены снижаются"}
                      {" | "}
                      {rec.crop.russiaDemand === "deficit" ? "Дефицит в РФ" : "Баланс в РФ"}
                      {" | "}
                      Рентабельность {rec.crop.avgProfitabilityPct}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Ожидаемая прибыль</p>
                  <p className="text-xl font-bold text-green-600">{rec.expectedProfitPerHa.toLocaleString("ru-RU")} ₽/га</p>
                  <p className="text-xs text-gray-400">Всего: {(rec.expectedTotalProfit / 1_000_000).toFixed(1)} млн ₽</p>
                </div>
              </div>

              {/* Детали */}
              <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Климат и условия */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Условия выращивания</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                    <span>Температура: {rec.crop.tempRange.min}–{rec.crop.tempRange.max}°C (оптим. {rec.crop.tempRange.optimal}°C)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="h-3.5 w-3.5 text-blue-500" />
                    <span>Влага: от {rec.crop.waterNeedMm.min} мм/сезон</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Leaf className="h-3.5 w-3.5 text-green-500" />
                    <span>Вегетация: {rec.crop.vegetationDays.min}–{rec.crop.vegetationDays.max} дней</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                    <span>Цена: {rec.crop.pricePerTon.current.toLocaleString("ru-RU")} ₽/т (макс. {rec.crop.pricePerTon.max.toLocaleString("ru-RU")})</span>
                  </div>
                  <p className="text-xs text-gray-400">Затраты: {rec.crop.costPerHa.toLocaleString("ru-RU")} ₽/га | Урожайность: {(rec.crop.avgYieldKgHa / 100).toFixed(0)} ц/га</p>
                </div>

                {/* Почему подходит */}
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase mb-2">Почему рекомендуем</p>
                  {rec.reasons.map((r, i) => (
                    <p key={i} className="text-sm text-gray-700 flex items-start gap-1.5 mb-1">
                      <span className="text-green-500 mt-0.5">+</span> {r}
                    </p>
                  ))}
                  {!rec.needsNewEquipment && (
                    <p className="text-sm text-green-600 font-medium mt-1">Доп. техника не нужна</p>
                  )}
                </div>

                {/* Риски */}
                <div>
                  <p className="text-xs font-semibold text-red-500 uppercase mb-2">Риски и предупреждения</p>
                  {rec.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-gray-600 flex items-start gap-1.5 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" /> {w}
                    </p>
                  ))}
                  {rec.crop.risks.map((r, i) => (
                    <p key={`r-${i}`} className="text-sm text-gray-500 flex items-start gap-1.5 mb-1">
                      <span className="text-red-400 mt-0.5">!</span> {r}
                    </p>
                  ))}
                </div>
              </div>

              {/* Мировые факторы */}
              {rec.worldFactors.length > 0 && (
                <div className="px-5 py-3 bg-blue-50 border-t border-blue-100">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Мировые факторы:</p>
                  {rec.worldFactors.map((f) => (
                    <p key={f.id} className="text-xs text-blue-600">
                      {f.impact === "positive" ? "📈" : "📉"} {f.title} — <span className="italic">{f.description}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
