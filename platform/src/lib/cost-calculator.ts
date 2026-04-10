/**
 * КАЛЬКУЛЯТОР СЕБЕСТОИМОСТИ НА ГЕКТАР
 *
 * Себестоимость = ГСМ + семена + удобрения + СЗР + зарплата + амортизация + прочие
 *
 * Использует данные из:
 * - equipment-catalog.ts (расход ГСМ, стоимость техники)
 * - inventory (стоимость семян, удобрений, СЗР)
 * - fuel records (фактический расход)
 * - activities (фактические затраты)
 */

export interface CostBreakdown {
  fuel: number;         // ГСМ
  seeds: number;        // Семена
  fertilizer: number;   // Удобрения
  pesticide: number;    // СЗР (пестициды)
  labor: number;        // Зарплата
  depreciation: number; // Амортизация техники
  maintenance: number;  // Ремонт и ТО
  rent: number;         // Аренда техники/земли
  other: number;        // Прочие
  total: number;        // Итого
}

export interface FieldProfitability {
  fieldId: string;
  fieldName: string;
  areaHa: number;
  crop: string;
  year: number;
  // Затраты
  costs: CostBreakdown;
  costPerHa: number;
  costPerTon: number;
  // Доход
  yieldKgHa: number;
  totalYieldTons: number;
  pricePerTon: number;
  revenue: number;
  revenuePerHa: number;
  // Рентабельность
  profit: number;
  profitPerHa: number;
  profitabilityPct: number; // (доход - затраты) / затраты × 100
  // Сравнение
  regionAvgCostPerHa?: number;
  isAboveAverage: boolean;
}

/** Средние рыночные цены 2025-2026, ₽/тонна */
export const CROP_PRICES_PER_TON: Record<string, { min: number; avg: number; max: number }> = {
  "Пшеница озимая":   { min: 12000, avg: 15000, max: 20000 },
  "Пшеница яровая":   { min: 11000, avg: 14000, max: 18000 },
  "Ячмень яровой":    { min: 9000,  avg: 12000, max: 15000 },
  "Кукуруза":         { min: 10000, avg: 13000, max: 17000 },
  "Подсолнечник":     { min: 25000, avg: 32000, max: 40000 },
  "Соя":              { min: 30000, avg: 38000, max: 48000 },
  "Рапс":             { min: 28000, avg: 35000, max: 45000 },
  "Сахарная свёкла":  { min: 3500,  avg: 4500,  max: 6000 },
  "Горох":            { min: 15000, avg: 20000, max: 28000 },
  "Гречиха":          { min: 20000, avg: 28000, max: 40000 },
};

/** Средние затраты по Центральному Черноземью, ₽/га */
export const REGION_AVG_COSTS: Record<string, number> = {
  "Пшеница озимая":   35000,
  "Пшеница яровая":   30000,
  "Ячмень яровой":    28000,
  "Кукуруза":         45000,
  "Подсолнечник":     25000,
  "Соя":              28000,
  "Рапс":             32000,
  "Сахарная свёкла":  80000,
  "Горох":            22000,
};

/** Типовая структура затрат, ₽/га */
export const TYPICAL_COSTS_PER_HA: Record<string, CostBreakdown> = {
  "Пшеница озимая": {
    fuel: 5500, seeds: 5000, fertilizer: 10000, pesticide: 4500,
    labor: 3000, depreciation: 4000, maintenance: 2000, rent: 0, other: 1000, total: 35000,
  },
  "Подсолнечник": {
    fuel: 4000, seeds: 3500, fertilizer: 5000, pesticide: 4000,
    labor: 2500, depreciation: 3000, maintenance: 1500, rent: 0, other: 1500, total: 25000,
  },
  "Кукуруза": {
    fuel: 6000, seeds: 8000, fertilizer: 14000, pesticide: 5000,
    labor: 3500, depreciation: 4500, maintenance: 2500, rent: 0, other: 1500, total: 45000,
  },
  "Сахарная свёкла": {
    fuel: 8000, seeds: 12000, fertilizer: 20000, pesticide: 15000,
    labor: 8000, depreciation: 7000, maintenance: 5000, rent: 0, other: 5000, total: 80000,
  },
};

/** Рассчитать рентабельность поля */
export function calculateProfitability(
  fieldName: string,
  fieldId: string,
  areaHa: number,
  crop: string,
  year: number,
  costs: Partial<CostBreakdown>,
  yieldKgHa: number,
  pricePerTon?: number
): FieldProfitability {
  const typicalCosts = TYPICAL_COSTS_PER_HA[crop];
  const fullCosts: CostBreakdown = {
    fuel: costs.fuel ?? typicalCosts?.fuel ?? 5000,
    seeds: costs.seeds ?? typicalCosts?.seeds ?? 4000,
    fertilizer: costs.fertilizer ?? typicalCosts?.fertilizer ?? 8000,
    pesticide: costs.pesticide ?? typicalCosts?.pesticide ?? 4000,
    labor: costs.labor ?? typicalCosts?.labor ?? 3000,
    depreciation: costs.depreciation ?? typicalCosts?.depreciation ?? 3500,
    maintenance: costs.maintenance ?? typicalCosts?.maintenance ?? 2000,
    rent: costs.rent ?? 0,
    other: costs.other ?? 1000,
    total: 0,
  };
  fullCosts.total = Object.values(fullCosts).reduce((a, b) => a + b, 0) - fullCosts.total;

  const cropPrices = CROP_PRICES_PER_TON[crop];
  const price = pricePerTon ?? cropPrices?.avg ?? 15000;
  const totalYieldTons = (yieldKgHa * areaHa) / 1000;
  const revenue = totalYieldTons * price;
  const totalCost = fullCosts.total * areaHa;
  const profit = revenue - totalCost;

  return {
    fieldId,
    fieldName,
    areaHa,
    crop,
    year,
    costs: fullCosts,
    costPerHa: fullCosts.total,
    costPerTon: yieldKgHa > 0 ? Math.round((fullCosts.total * 1000) / yieldKgHa) : 0,
    yieldKgHa,
    totalYieldTons: Math.round(totalYieldTons * 10) / 10,
    pricePerTon: price,
    revenue: Math.round(revenue),
    revenuePerHa: Math.round(revenue / areaHa),
    profit: Math.round(profit),
    profitPerHa: Math.round(profit / areaHa),
    profitabilityPct: totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0,
    regionAvgCostPerHa: REGION_AVG_COSTS[crop],
    isAboveAverage: fullCosts.total > (REGION_AVG_COSTS[crop] ?? fullCosts.total),
  };
}

/** Сформировать бюджет сезона */
export function generateSeasonBudget(
  fields: { id: string; name: string; areaHa: number; crop: string }[]
): { byField: { fieldId: string; fieldName: string; crop: string; areaHa: number; budget: CostBreakdown }[]; total: CostBreakdown; totalArea: number } {
  const byField = fields.map((f) => {
    const typical = TYPICAL_COSTS_PER_HA[f.crop];
    const budget: CostBreakdown = typical
      ? { ...typical, total: typical.total }
      : { fuel: 5000, seeds: 4000, fertilizer: 8000, pesticide: 4000, labor: 3000, depreciation: 3500, maintenance: 2000, rent: 0, other: 1000, total: 30500 };

    return { fieldId: f.id, fieldName: f.name, crop: f.crop, areaHa: f.areaHa, budget };
  });

  const total: CostBreakdown = { fuel: 0, seeds: 0, fertilizer: 0, pesticide: 0, labor: 0, depreciation: 0, maintenance: 0, rent: 0, other: 0, total: 0 };
  byField.forEach((f) => {
    (Object.keys(total) as (keyof CostBreakdown)[]).forEach((key) => {
      total[key] += f.budget[key] * f.areaHa;
    });
  });

  return { byField, total, totalArea: fields.reduce((s, f) => s + f.areaHa, 0) };
}
