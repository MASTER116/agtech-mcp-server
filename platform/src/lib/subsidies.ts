/**
 * БАЗА ЛЬГОТ И СУБСИДИЙ ДЛЯ С/Х
 *
 * Федеральные и региональные программы поддержки:
 * - Погектарная поддержка (Минсельхоз)
 * - Субсидии на технику
 * - Льготное кредитование
 * - Поддержка мелиорации
 * - Страхование урожая
 * - Региональные программы
 *
 * Расчёт суммы под условия конкретного клиента
 */

// ═══════════════════════════════════════════════
// Типы
// ═══════════════════════════════════════════════

export interface SubsidyProgram {
  id: string;
  /** Название программы */
  name: string;
  /** Уровень: федеральный / региональный */
  level: "federal" | "regional";
  /** Регион (для региональных) */
  regionId?: string;
  regionName?: string;
  /** Описание */
  description: string;
  /** Категория */
  category: "land" | "equipment" | "credit" | "insurance" | "melioration" | "cattle" | "storage" | "organic" | "young_farmer";
  /** Ссылка на официальный источник */
  sourceUrl: string;
  /** Нормативный акт */
  legalBasis: string;
  /** Условия получения */
  conditions: SubsidyCondition[];
  /** Формула расчёта */
  calculation: SubsidyCalculation;
  /** Дедлайн подачи заявки */
  deadline?: string;
  /** Год действия */
  year: number;
  /** Активна */
  active: boolean;
}

export interface SubsidyCondition {
  field: "areaHa" | "equipmentCount" | "revenue" | "region" | "cropType" | "isSmallFarm" | "yearsInBusiness" | "hasInsurance" | "isYoungFarmer";
  operator: "gte" | "lte" | "eq" | "in" | "between";
  value: number | string | number[] | string[];
  label: string;
}

export interface SubsidyCalculation {
  type: "per_ha" | "per_unit" | "percent_of_cost" | "fixed" | "tiered";
  /** Ставка (₽/га, ₽/ед, %, фиксированная сумма) */
  rate?: number;
  /** Тарифная сетка */
  tiers?: { from: number; to: number; rate: number; unit: string }[];
  /** Максимальная сумма */
  maxAmount?: number;
  /** Минимальная сумма */
  minAmount?: number;
}

export interface SubsidyResult {
  program: SubsidyProgram;
  /** Подходит ли клиенту */
  eligible: boolean;
  /** Причины несоответствия */
  ineligibleReasons: string[];
  /** Рассчитанная сумма, ₽ */
  estimatedAmount: number;
  /** Детали расчёта */
  calculationDetails: string;
  /** Что нужно для получения */
  requiredDocuments: string[];
}

// ═══════════════════════════════════════════════
// КОНТЕКСТ КЛИЕНТА
// ═══════════════════════════════════════════════

export interface FarmProfile {
  regionId: string;
  regionName: string;
  areaHa: number;
  equipmentCount: number;
  equipmentValue: number; // суммарная стоимость техники
  annualRevenue?: number;
  crops: string[];
  isSmallFarm: boolean; // до 500 га
  yearsInBusiness: number;
  hasInsurance: boolean;
  isYoungFarmer: boolean; // до 35 лет
  plannedPurchases?: { type: string; costRub: number }[];
}

// ═══════════════════════════════════════════════
// БАЗА СУБСИДИЙ 2025-2026
// ═══════════════════════════════════════════════

export const SUBSIDY_PROGRAMS: SubsidyProgram[] = [
  // ── ФЕДЕРАЛЬНЫЕ ──
  {
    id: "fed-pogectarnaya",
    name: "Погектарная поддержка (несвязанная)",
    level: "federal",
    description: "Субсидия на возмещение части затрат на проведение комплекса агротехнологических работ. Выплачивается на 1 га посевной площади.",
    category: "land",
    sourceUrl: "https://mcx.gov.ru/ministry/departments/departament-ekonomiki-i-gosudarstvennoy-podderzhki-apk/",
    legalBasis: "Постановление Правительства РФ №717 (Госпрограмма развития с/х)",
    conditions: [
      { field: "areaHa", operator: "gte", value: 1, label: "Площадь посевов от 1 га" },
    ],
    calculation: {
      type: "tiered",
      tiers: [
        { from: 1, to: 100, rate: 500, unit: "₽/га" },
        { from: 100, to: 500, rate: 450, unit: "₽/га" },
        { from: 500, to: 2000, rate: 400, unit: "₽/га" },
        { from: 2000, to: 100000, rate: 350, unit: "₽/га" },
      ],
    },
    deadline: "15 марта",
    year: 2026,
    active: true,
  },
  {
    id: "fed-technika-1432",
    name: "Субсидия на приобретение техники (Постановление 1432)",
    level: "federal",
    description: "Скидка 15-20% на российскую сельхозтехнику при покупке у производителя через программу Росагролизинг/1432.",
    category: "equipment",
    sourceUrl: "https://mcx.gov.ru/upload/iblock/742/Postanovlenie-Pravitelstva-RF-1432.pdf",
    legalBasis: "Постановление Правительства РФ №1432",
    conditions: [
      { field: "areaHa", operator: "gte", value: 50, label: "Площадь от 50 га" },
    ],
    calculation: {
      type: "percent_of_cost",
      rate: 20,
      maxAmount: 5_000_000,
    },
    year: 2026,
    active: true,
  },
  {
    id: "fed-credit-lgotniy",
    name: "Льготное кредитование (до 5% годовых)",
    level: "federal",
    description: "Краткосрочные и инвестиционные кредиты по ставке до 5% годовых. Разницу со ставкой ЦБ компенсирует государство.",
    category: "credit",
    sourceUrl: "https://mcx.gov.ru/ministry/departments/departament-ekonomiki-i-gosudarstvennoy-podderzhki-apk/industry-information/info-lgotnoe-kreditovanie/",
    legalBasis: "Постановление Правительства РФ №1528",
    conditions: [
      { field: "areaHa", operator: "gte", value: 10, label: "Площадь от 10 га" },
    ],
    calculation: {
      type: "tiered",
      tiers: [
        { from: 1, to: 500, rate: 5_000_000, unit: "макс. сумма кредита" },
        { from: 500, to: 2000, rate: 20_000_000, unit: "макс. сумма кредита" },
        { from: 2000, to: 10000, rate: 50_000_000, unit: "макс. сумма кредита" },
        { from: 10000, to: 100000, rate: 200_000_000, unit: "макс. сумма кредита" },
      ],
    },
    year: 2026,
    active: true,
  },
  {
    id: "fed-insurance",
    name: "Субсидия на страхование урожая",
    level: "federal",
    description: "Государство компенсирует 50% страховой премии при страховании посевов от ЧС, засухи, заморозков.",
    category: "insurance",
    sourceUrl: "https://mcx.gov.ru/activity/state-support/measures/selskokhozyaystvennoe-strakhovanie/",
    legalBasis: "ФЗ-260 «О государственной поддержке в сфере сельскохозяйственного страхования»",
    conditions: [
      { field: "areaHa", operator: "gte", value: 10, label: "Площадь от 10 га" },
      { field: "hasInsurance", operator: "eq", value: 1, label: "Наличие договора страхования" },
    ],
    calculation: {
      type: "tiered",
      tiers: [
        { from: 1, to: 500, rate: 500, unit: "₽/га (50% от премии ~1000₽/га)" },
        { from: 500, to: 5000, rate: 450, unit: "₽/га" },
        { from: 5000, to: 100000, rate: 400, unit: "₽/га" },
      ],
      maxAmount: 10_000_000,
    },
    year: 2026,
    active: true,
  },
  {
    id: "fed-young-farmer",
    name: "Грант «Агростартап» для начинающих фермеров",
    level: "federal",
    description: "Грант до 7 млн ₽ для фермеров, начавших деятельность не более 2 лет назад.",
    category: "young_farmer",
    sourceUrl: "https://mcx.gov.ru/activity/state-support/measures/grant-agrostartap/",
    legalBasis: "Постановление Правительства РФ №717",
    conditions: [
      { field: "yearsInBusiness", operator: "lte", value: 2, label: "Стаж до 2 лет" },
      { field: "isSmallFarm", operator: "eq", value: 1, label: "Малая форма хозяйствования" },
    ],
    calculation: {
      type: "fixed",
      rate: 5_000_000,
      maxAmount: 7_000_000,
    },
    year: 2026,
    active: true,
  },
  {
    id: "fed-melioration",
    name: "Субсидия на мелиорацию",
    level: "federal",
    description: "Компенсация до 50% затрат на ввод в оборот мелиорированных земель и восстановление систем орошения.",
    category: "melioration",
    sourceUrl: "https://mcx.gov.ru/activity/state-support/measures/melioratsiya/",
    legalBasis: "Постановление Правительства РФ №731",
    conditions: [
      { field: "areaHa", operator: "gte", value: 50, label: "Площадь от 50 га" },
    ],
    calculation: {
      type: "percent_of_cost",
      rate: 50,
      maxAmount: 30_000_000,
    },
    year: 2026,
    active: true,
  },

  // ── РЕГИОНАЛЬНЫЕ: КРАСНОДАРСКИЙ КРАЙ ──
  {
    id: "krasnodar-small-farm",
    name: "Поддержка малых форм хозяйствования (Краснодарский край)",
    level: "regional",
    regionId: "krasnodar",
    regionName: "Краснодарский край",
    description: "Дополнительная субсидия от региона для КФХ с площадью до 1000 га. Ставка 700 ₽/га сверх федеральной.",
    category: "land",
    sourceUrl: "https://mcx.gov.ru/activity/state-support/measures/",
    legalBasis: "Закон Краснодарского края №3690-КЗ",
    conditions: [
      { field: "areaHa", operator: "lte", value: 1000, label: "Площадь до 1000 га" },
      { field: "region", operator: "eq", value: "krasnodar", label: "Краснодарский край" },
    ],
    calculation: {
      type: "per_ha",
      rate: 700,
      maxAmount: 700_000,
    },
    year: 2026,
    active: true,
  },
  {
    id: "krasnodar-equipment-regional",
    name: "Региональная поддержка обновления парка (Краснодарский край)",
    level: "regional",
    regionId: "krasnodar",
    regionName: "Краснодарский край",
    description: "Доп. субсидия 10% от стоимости техники российского производства сверх федеральной программы 1432.",
    category: "equipment",
    sourceUrl: "https://mcx.gov.ru/activity/state-support/measures/",
    legalBasis: "Постановление главы администрации Краснодарского края",
    conditions: [
      { field: "region", operator: "eq", value: "krasnodar", label: "Краснодарский край" },
      { field: "equipmentCount", operator: "gte", value: 1, label: "Наличие техники" },
    ],
    calculation: {
      type: "percent_of_cost",
      rate: 10,
      maxAmount: 3_000_000,
    },
    year: 2026,
    active: true,
  },

  // ── РЕГИОНАЛЬНЫЕ: РОСТОВСКАЯ ОБЛАСТЬ ──
  {
    id: "rostov-pogectarnaya",
    name: "Региональная погектарная поддержка (Ростовская область)",
    level: "regional",
    regionId: "rostov",
    regionName: "Ростовская область",
    description: "Доп. субсидия 600 ₽/га для хозяйств с площадью от 50 га.",
    category: "land",
    sourceUrl: "https://mcx.gov.ru/activity/state-support/measures/",
    legalBasis: "Постановление Правительства Ростовской области",
    conditions: [
      { field: "areaHa", operator: "gte", value: 50, label: "Площадь от 50 га" },
      { field: "region", operator: "eq", value: "rostov", label: "Ростовская область" },
    ],
    calculation: { type: "per_ha", rate: 600, maxAmount: 1_200_000 },
    year: 2026,
    active: true,
  },

  // ── РЕГИОНАЛЬНЫЕ: СТАВРОПОЛЬСКИЙ КРАЙ ──
  {
    id: "stavropol-drought",
    name: "Поддержка хозяйств в засушливых зонах (Ставропольский край)",
    level: "regional",
    regionId: "stavropol",
    regionName: "Ставропольский край",
    description: "Доп. субсидия 800 ₽/га для хозяйств в восточных засушливых районах.",
    category: "land",
    sourceUrl: "https://mcx.gov.ru/activity/state-support/measures/",
    legalBasis: "Постановление Правительства Ставропольского края",
    conditions: [
      { field: "areaHa", operator: "gte", value: 30, label: "Площадь от 30 га" },
      { field: "region", operator: "eq", value: "stavropol", label: "Ставропольский край" },
    ],
    calculation: { type: "per_ha", rate: 800, maxAmount: 2_000_000 },
    year: 2026,
    active: true,
  },
];

// ═══════════════════════════════════════════════
// КАЛЬКУЛЯТОР СУБСИДИЙ
// ═══════════════════════════════════════════════

function checkCondition(condition: SubsidyCondition, farm: FarmProfile): boolean {
  const fieldValues: Record<string, any> = {
    areaHa: farm.areaHa,
    equipmentCount: farm.equipmentCount,
    revenue: farm.annualRevenue || 0,
    region: farm.regionId,
    isSmallFarm: farm.isSmallFarm ? 1 : 0,
    yearsInBusiness: farm.yearsInBusiness,
    hasInsurance: farm.hasInsurance ? 1 : 0,
    isYoungFarmer: farm.isYoungFarmer ? 1 : 0,
  };
  const val = fieldValues[condition.field];

  switch (condition.operator) {
    case "gte": return val >= condition.value;
    case "lte": return val <= condition.value;
    case "eq": return val == condition.value;
    case "in": return (condition.value as string[]).includes(val);
    default: return true;
  }
}

function calculateAmount(calc: SubsidyCalculation, farm: FarmProfile): { amount: number; details: string } {
  let amount = 0;
  let details = "";

  switch (calc.type) {
    case "per_ha":
      amount = farm.areaHa * (calc.rate || 0);
      details = `${farm.areaHa} га × ${calc.rate} ₽/га = ${amount.toLocaleString("ru-RU")} ₽`;
      break;

    case "per_unit":
      amount = farm.equipmentCount * (calc.rate || 0);
      details = `${farm.equipmentCount} ед. × ${calc.rate?.toLocaleString("ru-RU")} ₽ = ${amount.toLocaleString("ru-RU")} ₽`;
      break;

    case "percent_of_cost":
      const baseCost = farm.plannedPurchases?.reduce((s, p) => s + p.costRub, 0) || farm.equipmentValue * 0.1;
      amount = baseCost * (calc.rate || 0) / 100;
      details = `${calc.rate}% от ${baseCost.toLocaleString("ru-RU")} ₽ = ${amount.toLocaleString("ru-RU")} ₽`;
      break;

    case "fixed":
      amount = calc.rate || 0;
      details = `Фиксированная сумма: ${amount.toLocaleString("ru-RU")} ₽`;
      break;

    case "tiered":
      if (calc.tiers) {
        for (const tier of calc.tiers) {
          if (farm.areaHa >= tier.from && farm.areaHa <= tier.to) {
            if (tier.unit.includes("макс. сумма")) {
              amount = tier.rate;
              details = `При площади ${farm.areaHa} га: макс. сумма ${tier.rate.toLocaleString("ru-RU")} ₽`;
            } else {
              amount = farm.areaHa * tier.rate;
              details = `${farm.areaHa} га × ${tier.rate} ${tier.unit} = ${amount.toLocaleString("ru-RU")} ₽`;
            }
            break;
          }
        }
      }
      break;
  }

  if (calc.maxAmount && amount > calc.maxAmount) {
    amount = calc.maxAmount;
    details += ` (ограничено макс. ${calc.maxAmount.toLocaleString("ru-RU")} ₽)`;
  }

  return { amount: Math.round(amount), details };
}

export function calculateSubsidies(farm: FarmProfile): SubsidyResult[] {
  return SUBSIDY_PROGRAMS
    .filter(p => p.active)
    .map((program) => {
      const ineligibleReasons: string[] = [];
      let eligible = true;

      for (const cond of program.conditions) {
        if (!checkCondition(cond, farm)) {
          eligible = false;
          ineligibleReasons.push(`Не выполнено: ${cond.label}`);
        }
      }

      // Региональные — только для своего региона
      if (program.regionId && program.regionId !== farm.regionId) {
        eligible = false;
        ineligibleReasons.push(`Только для: ${program.regionName}`);
      }

      const { amount, details } = eligible
        ? calculateAmount(program.calculation, farm)
        : { amount: 0, details: "—" };

      const requiredDocuments = [
        "Заявление на получение субсидии",
        "Справка о постановке на учёт в налоговом органе",
        "Выписка из ЕГРЮЛ/ЕГРИП",
        "Справка об отсутствии задолженности по налогам",
        ...(program.category === "equipment" ? ["Договор поставки техники", "Акт приёма-передачи"] : []),
        ...(program.category === "insurance" ? ["Договор страхования", "Платёжное поручение на оплату премии"] : []),
        ...(program.category === "land" ? ["Сведения о посевных площадях (форма 4-СХ)"] : []),
      ];

      return {
        program,
        eligible,
        ineligibleReasons,
        estimatedAmount: amount,
        calculationDetails: details,
        requiredDocuments,
      };
    })
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.estimatedAmount - a.estimatedAmount;
    });
}

/** Общая сумма доступных субсидий */
export function getTotalAvailableSubsidies(farm: FarmProfile): { total: number; count: number; programs: SubsidyResult[] } {
  const results = calculateSubsidies(farm);
  const eligible = results.filter(r => r.eligible);
  return {
    total: eligible.reduce((s, r) => s + r.estimatedAmount, 0),
    count: eligible.length,
    programs: results,
  };
}
