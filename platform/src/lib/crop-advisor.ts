/**
 * ПРЕДИКТИВНЫЙ СОВЕТНИК ПО КУЛЬТУРАМ
 *
 * Рекомендует новые прибыльные культуры на основе:
 * 1. Климатическая зона и природные условия
 * 2. Тип почвы и качество
 * 3. Мировые тренды цен и кризисы
 * 4. Внутренний рынок РФ — дефицит/профицит
 * 5. Севооборот (предшественники)
 * 6. Имеющаяся техника (что можно убрать без доп. инвестиций)
 * 7. Региональные особенности
 */

// ═══════════════════════════════════════════════
// БАЗА ЗНАНИЙ О КУЛЬТУРАХ
// ═══════════════════════════════════════════════

export interface CropProfile {
  id: string;
  name: string;
  /** Мин/макс температура вегетации, °C */
  tempRange: { min: number; optimal: number; max: number };
  /** Мин. сумма активных температур за сезон, °C */
  satRequired: number;
  /** Потребность во влаге, мм за сезон */
  waterNeedMm: { min: number; optimal: number };
  /** Подходящие типы почв */
  soilTypes: string[];
  /** Оптимальный pH почвы */
  phRange: { min: number; max: number };
  /** Длительность вегетации, дней */
  vegetationDays: { min: number; max: number };
  /** Месяцы посева (для ЦЧР) */
  sowingMonths: number[];
  /** Месяцы уборки */
  harvestMonths: number[];
  /** Какая техника нужна для уборки */
  requiredEquipment: string[];
  /** Средняя урожайность, кг/га */
  avgYieldKgHa: number;
  /** Затраты, ₽/га */
  costPerHa: number;
  /** Рентабельность, % (средняя по РФ) */
  avgProfitabilityPct: number;
  /** Рыночная цена, ₽/т (2025-2026) */
  pricePerTon: { min: number; current: number; max: number };
  /** Мировой тренд */
  worldTrend: "rising" | "stable" | "falling";
  /** Причина тренда */
  trendReason: string;
  /** Дефицит/профицит в РФ */
  russiaDemand: "deficit" | "balanced" | "surplus";
  /** Экспортный потенциал */
  exportPotential: "high" | "medium" | "low";
  /** Риски */
  risks: string[];
  /** Преимущества */
  advantages: string[];
}

export const CROP_PROFILES: CropProfile[] = [
  {
    id: "chickpea",
    name: "Нут",
    tempRange: { min: 5, optimal: 22, max: 35 },
    satRequired: 1800,
    waterNeedMm: { min: 250, optimal: 350 },
    soilTypes: ["Чернозём обыкновенный", "Чернозём типичный", "Каштановая"],
    phRange: { min: 6.0, max: 8.5 },
    vegetationDays: { min: 80, max: 120 },
    sowingMonths: [4, 5],
    harvestMonths: [7, 8],
    requiredEquipment: ["GRAIN_COMBINE"],
    avgYieldKgHa: 1500,
    costPerHa: 18000,
    avgProfitabilityPct: 120,
    pricePerTon: { min: 40000, current: 55000, max: 75000 },
    worldTrend: "rising",
    trendReason: "Рост спроса в Индии, Турции, странах Ближнего Востока. Засуха в Индии 2025 снизила урожай на 30%.",
    russiaDemand: "deficit",
    exportPotential: "high",
    risks: ["Чувствителен к переувлажнению", "Фузариоз при высокой влажности"],
    advantages: ["Высокая маржинальность", "Фиксация азота (улучшает почву)", "Низкие затраты на удобрения", "Засухоустойчивость"],
  },
  {
    id: "lentil",
    name: "Чечевица",
    tempRange: { min: 3, optimal: 20, max: 32 },
    satRequired: 1600,
    waterNeedMm: { min: 200, optimal: 350 },
    soilTypes: ["Чернозём обыкновенный", "Чернозём выщелоченный", "Серая лесная"],
    phRange: { min: 5.5, max: 8.0 },
    vegetationDays: { min: 75, max: 115 },
    sowingMonths: [4, 5],
    harvestMonths: [7, 8],
    requiredEquipment: ["GRAIN_COMBINE"],
    avgYieldKgHa: 1200,
    costPerHa: 16000,
    avgProfitabilityPct: 100,
    pricePerTon: { min: 35000, current: 48000, max: 65000 },
    worldTrend: "rising",
    trendReason: "Канада (40% мирового экспорта) снизила посевы. Растущий спрос на растительный белок.",
    russiaDemand: "deficit",
    exportPotential: "high",
    risks: ["Полегание при переувлажнении", "Сложности уборки при низком стеблестое"],
    advantages: ["Отличный предшественник для пшеницы", "Низкие затраты", "Высокий экспортный спрос"],
  },
  {
    id: "flax-oil",
    name: "Лён масличный",
    tempRange: { min: 3, optimal: 18, max: 30 },
    satRequired: 1400,
    waterNeedMm: { min: 250, optimal: 400 },
    soilTypes: ["Чернозём обыкновенный", "Чернозём выщелоченный", "Серая лесная", "Дерново-подзолистая"],
    phRange: { min: 5.0, max: 7.5 },
    vegetationDays: { min: 80, max: 110 },
    sowingMonths: [4, 5],
    harvestMonths: [8, 9],
    requiredEquipment: ["GRAIN_COMBINE"],
    avgYieldKgHa: 1200,
    costPerHa: 15000,
    avgProfitabilityPct: 90,
    pricePerTon: { min: 28000, current: 38000, max: 50000 },
    worldTrend: "rising",
    trendReason: "Рост спроса на льняное масло (ЗОЖ-тренд). Дефицит в ЕС после снижения посевов в Казахстане.",
    russiaDemand: "deficit",
    exportPotential: "high",
    risks: ["Осыпание при перестое", "Полегание"],
    advantages: ["Низкие затраты на выращивание", "Хороший предшественник", "Стабильный экспортный спрос"],
  },
  {
    id: "mustard",
    name: "Горчица",
    tempRange: { min: 2, optimal: 20, max: 35 },
    satRequired: 1400,
    waterNeedMm: { min: 200, optimal: 300 },
    soilTypes: ["Чернозём обыкновенный", "Каштановая", "Чернозём типичный"],
    phRange: { min: 5.5, max: 8.0 },
    vegetationDays: { min: 80, max: 105 },
    sowingMonths: [4, 5],
    harvestMonths: [7, 8],
    requiredEquipment: ["GRAIN_COMBINE"],
    avgYieldKgHa: 1000,
    costPerHa: 12000,
    avgProfitabilityPct: 110,
    pricePerTon: { min: 30000, current: 42000, max: 60000 },
    worldTrend: "stable",
    trendReason: "Стабильный спрос от пищевой промышленности. Россия — крупнейший экспортёр.",
    russiaDemand: "balanced",
    exportPotential: "high",
    risks: ["Крестоцветная блошка", "Нельзя после рапса"],
    advantages: ["Очень низкие затраты", "Засухоустойчивость", "Фитосанитарная культура"],
  },
  {
    id: "safflower",
    name: "Сафлор",
    tempRange: { min: 5, optimal: 25, max: 40 },
    satRequired: 2000,
    waterNeedMm: { min: 150, optimal: 250 },
    soilTypes: ["Каштановая", "Чернозём обыкновенный"],
    phRange: { min: 6.0, max: 8.5 },
    vegetationDays: { min: 100, max: 130 },
    sowingMonths: [4, 5],
    harvestMonths: [8, 9],
    requiredEquipment: ["GRAIN_COMBINE"],
    avgYieldKgHa: 1200,
    costPerHa: 14000,
    avgProfitabilityPct: 85,
    pricePerTon: { min: 25000, current: 35000, max: 50000 },
    worldTrend: "rising",
    trendReason: "Замена подсолнечника в засушливых регионах. Рост спроса на сафлоровое масло.",
    russiaDemand: "deficit",
    exportPotential: "medium",
    risks: ["Только для засушливых регионов", "Ограниченный рынок сбыта"],
    advantages: ["Экстремальная засухоустойчивость", "Не требует подсолнечникового севооборота", "Стержневой корень 2м"],
  },
  {
    id: "camelina",
    name: "Рыжик посевной",
    tempRange: { min: 0, optimal: 18, max: 30 },
    satRequired: 1200,
    waterNeedMm: { min: 150, optimal: 300 },
    soilTypes: ["Чернозём обыкновенный", "Серая лесная", "Дерново-подзолистая", "Каштановая"],
    phRange: { min: 5.0, max: 7.5 },
    vegetationDays: { min: 70, max: 90 },
    sowingMonths: [4, 5],
    harvestMonths: [7],
    requiredEquipment: ["GRAIN_COMBINE"],
    avgYieldKgHa: 1500,
    costPerHa: 10000,
    avgProfitabilityPct: 130,
    pricePerTon: { min: 22000, current: 30000, max: 40000 },
    worldTrend: "rising",
    trendReason: "Спрос на биотопливо (SAF — авиационное). ЕС субсидирует производство рыжикового масла.",
    russiaDemand: "deficit",
    exportPotential: "high",
    risks: ["Мелкие семена — потери при уборке", "Ограниченный выбор сортов"],
    advantages: ["Минимальные затраты из всех масличных", "Ультраскороспелость", "Морозостойкость", "Биотопливный рынок"],
  },
  {
    id: "sorghum",
    name: "Сорго зерновое",
    tempRange: { min: 10, optimal: 28, max: 42 },
    satRequired: 2200,
    waterNeedMm: { min: 200, optimal: 350 },
    soilTypes: ["Чернозём обыкновенный", "Каштановая"],
    phRange: { min: 5.5, max: 8.5 },
    vegetationDays: { min: 100, max: 130 },
    sowingMonths: [5, 6],
    harvestMonths: [9, 10],
    requiredEquipment: ["GRAIN_COMBINE"],
    avgYieldKgHa: 3500,
    costPerHa: 18000,
    avgProfitabilityPct: 70,
    pricePerTon: { min: 10000, current: 14000, max: 20000 },
    worldTrend: "rising",
    trendReason: "Глобальное потепление расширяет зону возделывания. Замена кукурузы в засушливых регионах.",
    russiaDemand: "deficit",
    exportPotential: "medium",
    risks: ["Только тёплые регионы (ЮФО, СКФО)", "Птицы повреждают посевы"],
    advantages: ["Засухоустойчивость выше кукурузы", "Кормовая база для животноводства", "Биоэнергетика"],
  },
];

// ═══════════════════════════════════════════════
// МИРОВЫЕ ФАКТОРЫ (обновляются из MCP/новостей)
// ═══════════════════════════════════════════════

export interface WorldFactor {
  id: string;
  title: string;
  description: string;
  affectedCrops: string[];
  impact: "positive" | "negative" | "neutral";
  source: string;
  date: string;
}

export const WORLD_FACTORS_2026: WorldFactor[] = [
  {
    id: "india-chickpea-crisis",
    title: "Засуха в Индии — дефицит нута",
    description: "Урожай нута в Индии снизился на 30% из-за засухи 2025. Индия — крупнейший потребитель. Цены выросли на 40%.",
    affectedCrops: ["chickpea"], impact: "positive",
    source: "https://www.fao.org/markets/", date: "2026-01",
  },
  {
    id: "eu-biofuel-mandate",
    title: "ЕС: мандат на биотопливо SAF",
    description: "С 2025 ЕС требует 2% авиатоплива из растительных масел. Рыжик — основное сырьё. Субсидии для производителей.",
    affectedCrops: ["camelina", "flax-oil"], impact: "positive",
    source: "https://ec.europa.eu/energy/topics/renewable-energy/", date: "2025-12",
  },
  {
    id: "canada-lentil-decline",
    title: "Канада снижает посевы чечевицы",
    description: "Площади под чечевицей в Канаде сократились на 15%. Канада обеспечивает 40% мирового экспорта.",
    affectedCrops: ["lentil"], impact: "positive",
    source: "https://www.statcan.gc.ca/", date: "2026-03",
  },
  {
    id: "global-warming-south-russia",
    title: "Потепление на юге России",
    description: "Сумма активных температур на Кубани выросла на 200°C за 10 лет. Расширяется зона сорго и нута.",
    affectedCrops: ["sorghum", "chickpea", "safflower"], impact: "positive",
    source: "https://cc.voeikovmgo.ru/", date: "2026-02",
  },
  {
    id: "protein-demand-growth",
    title: "Рост спроса на растительный белок",
    description: "Мировой рынок растительного белка растёт на 12% в год. Бобовые культуры в приоритете.",
    affectedCrops: ["chickpea", "lentil"], impact: "positive",
    source: "https://www.marketsandmarkets.com/", date: "2026-01",
  },
];

// ═══════════════════════════════════════════════
// РЕКОМЕНДАТЕЛЬНЫЙ ДВИЖОК
// ═══════════════════════════════════════════════

export interface CropRecommendation {
  crop: CropProfile;
  /** Общий рейтинг 0-100 */
  score: number;
  /** Ожидаемая прибыль, ₽/га */
  expectedProfitPerHa: number;
  /** Ожидаемая прибыль всего, ₽ */
  expectedTotalProfit: number;
  /** Почему подходит */
  reasons: string[];
  /** Риски */
  warnings: string[];
  /** Связанные мировые факторы */
  worldFactors: WorldFactor[];
  /** Нужна ли доп. техника */
  needsNewEquipment: boolean;
  /** Подходит ли под севооборот */
  rotationCompatible: boolean;
}

export interface FarmContext {
  regionId: string;
  avgTemp: { summer: number; winter: number };
  avgPrecipitationMm: number;
  soilTypes: string[];
  currentCrops: string[];
  areaHa: number;
  equipmentCategories: string[];
}

export function recommendCrops(ctx: FarmContext): CropRecommendation[] {
  return CROP_PROFILES.map((crop) => {
    let score = 50;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Климатическое соответствие
    if (ctx.avgTemp.summer >= crop.tempRange.min && ctx.avgTemp.summer <= crop.tempRange.max) {
      score += 10;
      if (Math.abs(ctx.avgTemp.summer - crop.tempRange.optimal) < 5) {
        score += 5;
        reasons.push(`Температура оптимальна (${ctx.avgTemp.summer}°C, идеал ${crop.tempRange.optimal}°C)`);
      }
    } else {
      score -= 30;
      warnings.push(`Температура не подходит: ${ctx.avgTemp.summer}°C, нужно ${crop.tempRange.min}-${crop.tempRange.max}°C`);
    }

    // 2. Влагообеспеченность
    if (ctx.avgPrecipitationMm >= crop.waterNeedMm.min) {
      score += 5;
      if (ctx.avgPrecipitationMm >= crop.waterNeedMm.optimal) {
        score += 5;
      }
    } else {
      score -= 15;
      warnings.push(`Недостаточно осадков: ${ctx.avgPrecipitationMm} мм, нужно мин. ${crop.waterNeedMm.min} мм`);
    }

    // 3. Почва
    const soilMatch = ctx.soilTypes.some(s => crop.soilTypes.includes(s));
    if (soilMatch) {
      score += 10;
      reasons.push("Подходящий тип почвы");
    } else {
      score -= 10;
      warnings.push("Тип почвы не оптимален для данной культуры");
    }

    // 4. Мировой тренд
    if (crop.worldTrend === "rising") { score += 10; reasons.push("Мировые цены растут"); }
    if (crop.russiaDemand === "deficit") { score += 8; reasons.push("Дефицит в РФ — высокий спрос"); }
    if (crop.exportPotential === "high") { score += 5; reasons.push("Высокий экспортный потенциал"); }

    // 5. Рентабельность
    if (crop.avgProfitabilityPct > 100) { score += 10; reasons.push(`Рентабельность ${crop.avgProfitabilityPct}%`); }
    else if (crop.avgProfitabilityPct > 70) { score += 5; }

    // 6. Севооборот — не конфликтует с текущими
    const rotationCompatible = !ctx.currentCrops.includes(crop.name);
    if (rotationCompatible) { score += 5; }
    else { score -= 5; warnings.push("Уже выращиваете эту культуру"); }

    // 7. Техника
    const needsNewEquipment = !crop.requiredEquipment.every(eq => ctx.equipmentCategories.includes(eq));
    if (!needsNewEquipment) { score += 10; reasons.push("Имеющаяся техника подходит для уборки"); }
    else { score -= 5; warnings.push("Может потребоваться дополнительная техника"); }

    // 8. Мировые факторы
    const worldFactors = WORLD_FACTORS_2026.filter(f => f.affectedCrops.includes(crop.id));
    worldFactors.forEach(f => {
      if (f.impact === "positive") { score += 8; reasons.push(`📈 ${f.title}`); }
      else if (f.impact === "negative") { score -= 8; warnings.push(`📉 ${f.title}`); }
    });

    score = Math.max(0, Math.min(100, score));

    // Расчёт прибыли
    const revenuePerHa = (crop.avgYieldKgHa / 1000) * crop.pricePerTon.current;
    const expectedProfitPerHa = revenuePerHa - crop.costPerHa;
    const expectedTotalProfit = expectedProfitPerHa * ctx.areaHa;

    return {
      crop,
      score,
      expectedProfitPerHa: Math.round(expectedProfitPerHa),
      expectedTotalProfit: Math.round(expectedTotalProfit),
      reasons,
      warnings,
      worldFactors,
      needsNewEquipment,
      rotationCompatible,
    };
  })
  .filter(r => r.score >= 30)
  .sort((a, b) => b.score - a.score);
}
