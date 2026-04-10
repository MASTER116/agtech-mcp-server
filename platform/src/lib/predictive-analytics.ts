/**
 * ПРЕДИКТИВНАЯ АНАЛИТИКА ПОЛОМОК
 *
 * Рассчитывает вероятность отказа на основе:
 * 1. Моточасы + базовая вероятность из maintenance-db
 * 2. Погодные условия (MCP: температура, влажность, осадки)
 * 3. Региональные коэффициенты (почвы, рельеф, климат)
 * 4. Интенсивность эксплуатации (часы/день, тип работ)
 * 5. История ТО (соблюдение регламента)
 */

import { type CommonFailure, getFailureRisks, getMaintenanceProfile } from "./maintenance-db";
import { findSpecById, type EquipmentSpec } from "./equipment-catalog";

// ═══════════════════════════════════════════════
// РЕГИОНАЛЬНЫЕ КОЭФФИЦИЕНТЫ ИЗНОСА
// ═══════════════════════════════════════════════

export interface RegionProfile {
  id: string;
  name: string;
  /** Средняя температура по сезонам, °C */
  avgTemp: { winter: number; spring: number; summer: number; autumn: number };
  /** Тип почвы (влияет на ходовую) */
  soilHardness: "soft" | "medium" | "hard" | "rocky";
  /** Рельеф */
  terrain: "flat" | "hilly" | "mountainous";
  /** Пыльность (влияет на фильтры, двигатель) */
  dustLevel: "low" | "medium" | "high";
  /** Влажность (влияет на коррозию) */
  humidity: "dry" | "moderate" | "humid";
  /** Коэффициент износа (1.0 = нормальный, >1 = ускоренный) */
  wearMultipliers: {
    engine: number;
    transmission: number;
    hydraulics: number;
    chassis: number;
    electrical: number;
    cooling: number;
    harvesting_unit: number;
  };
  /** Особенности и рекомендации */
  notes: string[];
}

export const REGIONS: RegionProfile[] = [
  {
    id: "krasnodar",
    name: "Краснодарский край",
    avgTemp: { winter: 3, spring: 14, summer: 26, autumn: 14 },
    soilHardness: "medium", terrain: "flat", dustLevel: "high", humidity: "moderate",
    wearMultipliers: { engine: 1.1, transmission: 1.0, hydraulics: 1.0, chassis: 0.9, electrical: 1.0, cooling: 1.2, harvesting_unit: 1.1 },
    notes: [
      "Высокие температуры летом → повышенная нагрузка на систему охлаждения",
      "Пыль при уборке → чаще менять воздушные фильтры (каждые 50 м/ч вместо 125)",
      "Чернозём — мягкие почвы, щадящий режим для ходовой",
      "Длинный сезон уборки — высокий налёт на комбайнах",
    ],
  },
  {
    id: "rostov",
    name: "Ростовская область",
    avgTemp: { winter: -2, spring: 12, summer: 25, autumn: 12 },
    soilHardness: "medium", terrain: "hilly", dustLevel: "high", humidity: "dry",
    wearMultipliers: { engine: 1.1, transmission: 1.05, hydraulics: 1.0, chassis: 1.0, electrical: 1.0, cooling: 1.15, harvesting_unit: 1.1 },
    notes: [
      "Засушливый климат → перегрев двигателей летом",
      "Холмистый рельеф → повышенный износ трансмиссии",
      "Ветровая эрозия → абразивный износ деталей",
    ],
  },
  {
    id: "stavropol",
    name: "Ставропольский край",
    avgTemp: { winter: -1, spring: 13, summer: 24, autumn: 13 },
    soilHardness: "hard", terrain: "hilly", dustLevel: "high", humidity: "dry",
    wearMultipliers: { engine: 1.1, transmission: 1.1, hydraulics: 1.05, chassis: 1.15, electrical: 1.0, cooling: 1.1, harvesting_unit: 1.05 },
    notes: [
      "Тяжёлые каштановые почвы → повышенный износ ходовой и лемехов",
      "Каменистые участки → риск поломки жатки и плугов",
      "Сильные ветры → ускоренное засорение фильтров",
    ],
  },
  {
    id: "voronezh",
    name: "Воронежская область",
    avgTemp: { winter: -6, spring: 10, summer: 22, autumn: 9 },
    soilHardness: "medium", terrain: "flat", dustLevel: "medium", humidity: "moderate",
    wearMultipliers: { engine: 1.0, transmission: 1.0, hydraulics: 1.0, chassis: 1.0, electrical: 1.05, cooling: 1.0, harvesting_unit: 1.0 },
    notes: [
      "Умеренный климат — оптимальные условия эксплуатации",
      "Зимние морозы до -25°C → проблемы холодного запуска",
      "Чернозём — щадящий режим для ходовой",
    ],
  },
  {
    id: "tatarstan",
    name: "Татарстан",
    avgTemp: { winter: -12, spring: 8, summer: 21, autumn: 6 },
    soilHardness: "medium", terrain: "hilly", dustLevel: "medium", humidity: "moderate",
    wearMultipliers: { engine: 1.05, transmission: 1.05, hydraulics: 1.1, chassis: 1.05, electrical: 1.1, cooling: 0.95, harvesting_unit: 1.0 },
    notes: [
      "Холодные зимы → проблемы с гидравликой при запуске (масло загустевает)",
      "Короткий вегетационный сезон → интенсивная эксплуатация",
      "Перепады температур → конденсат в топливной системе",
    ],
  },
  {
    id: "altai",
    name: "Алтайский край",
    avgTemp: { winter: -16, spring: 6, summer: 20, autumn: 4 },
    soilHardness: "hard", terrain: "hilly", dustLevel: "medium", humidity: "dry",
    wearMultipliers: { engine: 1.15, transmission: 1.1, hydraulics: 1.2, chassis: 1.15, electrical: 1.15, cooling: 0.9, harvesting_unit: 1.05 },
    notes: [
      "Суровые зимы до -40°C → обязательный подогрев двигателя",
      "Короткое лето → работа техники 16-18 ч/сут",
      "Тяжёлые почвы → ускоренный износ почвообрабатывающих органов",
      "Гидравлика — главное слабое место зимой (замерзание уплотнений)",
    ],
  },
  {
    id: "novosibirsk",
    name: "Новосибирская область",
    avgTemp: { winter: -18, spring: 4, summer: 19, autumn: 3 },
    soilHardness: "medium", terrain: "flat", dustLevel: "low", humidity: "humid",
    wearMultipliers: { engine: 1.15, transmission: 1.1, hydraulics: 1.25, chassis: 1.1, electrical: 1.2, cooling: 0.85, harvesting_unit: 1.0 },
    notes: [
      "Экстремальные морозы → стартеры и аккумуляторы выходят из строя вдвое быстрее",
      "Влажные почвы весной → трактора вязнут, перегрузка трансмиссии",
      "Короткий сезон уборки (3-4 недели) → максимальная нагрузка на комбайны",
    ],
  },
  {
    id: "omsk",
    name: "Омская область",
    avgTemp: { winter: -17, spring: 5, summer: 20, autumn: 3 },
    soilHardness: "medium", terrain: "flat", dustLevel: "medium", humidity: "moderate",
    wearMultipliers: { engine: 1.1, transmission: 1.1, hydraulics: 1.2, chassis: 1.1, electrical: 1.15, cooling: 0.9, harvesting_unit: 1.05 },
    notes: [
      "Резко-континентальный климат → большие перепады температур",
      "Весенние затопления → коррозия рамы и ходовой",
      "Ветровая эрозия → абразив в фильтрах",
    ],
  },
  {
    id: "saratov",
    name: "Саратовская область",
    avgTemp: { winter: -8, spring: 10, summer: 24, autumn: 8 },
    soilHardness: "hard", terrain: "flat", dustLevel: "high", humidity: "dry",
    wearMultipliers: { engine: 1.1, transmission: 1.05, hydraulics: 1.0, chassis: 1.1, electrical: 1.05, cooling: 1.15, harvesting_unit: 1.1 },
    notes: [
      "Засуха → перегрев, пыль, ускоренный износ фильтров",
      "Солонцовые почвы — агрессивная среда для металла",
      "Суховеи → забивают радиаторы",
    ],
  },
  {
    id: "chelyabinsk",
    name: "Челябинская область",
    avgTemp: { winter: -14, spring: 6, summer: 19, autumn: 5 },
    soilHardness: "rocky", terrain: "mountainous", dustLevel: "medium", humidity: "moderate",
    wearMultipliers: { engine: 1.1, transmission: 1.15, hydraulics: 1.15, chassis: 1.25, electrical: 1.1, cooling: 0.95, harvesting_unit: 1.1 },
    notes: [
      "Каменистые почвы Южного Урала → ускоренный износ лемехов, дисков, ножей",
      "Неровный рельеф → нагрузка на раму и сочленения",
      "Зимний запуск при -35°C → стресс для всех систем",
    ],
  },
];

// ═══════════════════════════════════════════════
// ПОГОДНЫЕ КОЭФФИЦИЕНТЫ
// ═══════════════════════════════════════════════

export interface WeatherConditions {
  temperature: number;    // °C
  humidity: number;       // %
  precipitation: number;  // мм/день
  windSpeed: number;      // м/с
  dusty: boolean;         // пыльные условия
}

/** Коэффициент износа от текущей погоды */
export function getWeatherWearFactor(weather: WeatherConditions): Record<string, number> {
  const factors: Record<string, number> = {
    engine: 1.0,
    transmission: 1.0,
    hydraulics: 1.0,
    chassis: 1.0,
    electrical: 1.0,
    cooling: 1.0,
  };

  // Экстремальная жара (>35°C)
  if (weather.temperature > 35) {
    factors.engine += 0.3;
    factors.cooling += 0.5;
    factors.hydraulics += 0.15;
  } else if (weather.temperature > 30) {
    factors.engine += 0.15;
    factors.cooling += 0.25;
  }

  // Мороз (<-15°C)
  if (weather.temperature < -25) {
    factors.engine += 0.4;
    factors.hydraulics += 0.5;
    factors.electrical += 0.4;
    factors.transmission += 0.2;
  } else if (weather.temperature < -15) {
    factors.engine += 0.2;
    factors.hydraulics += 0.3;
    factors.electrical += 0.2;
  }

  // Высокая влажность (>80%)
  if (weather.humidity > 80) {
    factors.electrical += 0.2;
    factors.chassis += 0.1; // коррозия
  }

  // Пыльные условия
  if (weather.dusty || weather.windSpeed > 10) {
    factors.engine += 0.2;  // забиваются фильтры
    factors.cooling += 0.3; // радиаторы
  }

  // Дождь / мокрое поле
  if (weather.precipitation > 10) {
    factors.chassis += 0.15;     // грязь
    factors.transmission += 0.1; // пробуксовка
  }

  return factors;
}

// ═══════════════════════════════════════════════
// КОЭФФИЦИЕНТЫ ИНТЕНСИВНОСТИ ЭКСПЛУАТАЦИИ
// ═══════════════════════════════════════════════

export interface UsagePattern {
  avgHoursPerDay: number;      // среднее время работы в день
  predominantWork: "plowing" | "cultivation" | "seeding" | "spraying" | "harvesting" | "transport" | "mixed";
  maintenanceCompliance: number; // 0-1, как хорошо соблюдается регламент ТО
  operatorExperience: "novice" | "experienced" | "expert";
}

/** Коэффициент износа от паттерна использования */
export function getUsageWearFactor(usage: UsagePattern): number {
  let factor = 1.0;

  // Интенсивность (>12 ч/день = повышенный износ)
  if (usage.avgHoursPerDay > 16) factor += 0.4;
  else if (usage.avgHoursPerDay > 12) factor += 0.2;
  else if (usage.avgHoursPerDay > 10) factor += 0.1;

  // Тяжёлые работы
  if (usage.predominantWork === "plowing") factor += 0.25;
  else if (usage.predominantWork === "harvesting") factor += 0.15;
  else if (usage.predominantWork === "transport") factor += 0.1;

  // Несоблюдение ТО (самый сильный фактор!)
  if (usage.maintenanceCompliance < 0.5) factor += 0.5;
  else if (usage.maintenanceCompliance < 0.7) factor += 0.25;
  else if (usage.maintenanceCompliance < 0.9) factor += 0.1;

  // Опыт оператора
  if (usage.operatorExperience === "novice") factor += 0.2;
  else if (usage.operatorExperience === "expert") factor -= 0.1;

  return Math.max(0.5, factor);
}

// ═══════════════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ ПРЕДИКТИВНОЙ АНАЛИТИКИ
// ═══════════════════════════════════════════════

export interface FailurePrediction {
  /** ID поломки */
  failureId: string;
  /** Название */
  name: string;
  /** Система/узел */
  system: string;
  /** Вероятность отказа в ближайшие 500 моточасов, % */
  probabilityNext500h: number;
  /** Базовая вероятность (без корректировок) */
  baseProbability: number;
  /** Критичность */
  severity: "low" | "medium" | "high" | "critical";
  /** Уровень риска (для UI) */
  riskLevel: "green" | "yellow" | "orange" | "red";
  /** Стоимость ремонта, ₽ */
  repairCost: { min: number; avg: number; max: number };
  /** Время простоя, дней */
  downtime: { min: number; avg: number; max: number };
  /** Симптомы */
  symptoms: string[];
  /** Рекомендации */
  recommendations: string[];
  /** Факторы, увеличивающие риск */
  riskFactors: string[];
  /** Можно починить в поле */
  fieldRepairable: boolean;
}

export function predictFailures(
  modelId: string,
  currentHours: number,
  regionId?: string,
  weather?: WeatherConditions,
  usage?: UsagePattern
): FailurePrediction[] {
  const baseRisks = getFailureRisks(modelId, currentHours);
  if (baseRisks.length === 0) return [];

  const region = regionId ? REGIONS.find((r) => r.id === regionId) : undefined;
  const weatherFactors = weather ? getWeatherWearFactor(weather) : undefined;
  const usageFactor = usage ? getUsageWearFactor(usage) : 1.0;

  return baseRisks.map((failure) => {
    let probability = failure.currentProbability;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Региональная корректировка
    if (region) {
      const systemKey = failure.system.toLowerCase().replace(/[^a-z_]/g, "") as keyof typeof region.wearMultipliers;
      const regionMult = region.wearMultipliers[systemKey] ?? 1.0;
      if (regionMult > 1.05) {
        probability *= regionMult;
        riskFactors.push(`Регион ${region.name}: ×${regionMult.toFixed(2)} износ для ${failure.system}`);
      }
      // Добавляем региональные рекомендации
      region.notes.forEach((note) => {
        if (note.toLowerCase().includes(failure.system.toLowerCase())) {
          recommendations.push(note);
        }
      });
    }

    // Погодная корректировка
    if (weatherFactors) {
      const systemKey = failure.system.toLowerCase().replace(/[^a-z_]/g, "");
      const weatherMult = weatherFactors[systemKey] ?? 1.0;
      if (weatherMult > 1.1) {
        probability *= weatherMult;
        riskFactors.push(`Текущая погода: ×${weatherMult.toFixed(2)} нагрузка`);
      }
      if (weather!.temperature > 35) {
        recommendations.push("Сократить интервалы проверки системы охлаждения");
      }
      if (weather!.temperature < -20) {
        recommendations.push("Обязательный прогрев двигателя перед работой (15-20 мин)");
        recommendations.push("Использовать зимнее масло и предпусковой подогреватель");
      }
      if (weather!.dusty) {
        recommendations.push("Проверять и чистить воздушный фильтр каждые 4 часа");
      }
    }

    // Корректировка по интенсивности
    if (usageFactor > 1.1) {
      probability *= usageFactor;
      if (usage!.avgHoursPerDay > 12) {
        riskFactors.push(`Интенсивная эксплуатация: ${usage!.avgHoursPerDay} ч/день`);
      }
      if (usage!.maintenanceCompliance < 0.7) {
        riskFactors.push("Низкое соблюдение регламента ТО");
        recommendations.push("Провести внеплановое ТО для снижения рисков");
      }
      if (usage!.operatorExperience === "novice") {
        riskFactors.push("Неопытный оператор");
        recommendations.push("Обучение оператора правилам эксплуатации");
      }
    }

    // Корректировка по моточасам (нелинейный рост)
    const spec = findSpecById(modelId);
    if (spec) {
      const lifeRatio = currentHours / spec.maintenance.engineLifeHours;
      if (lifeRatio > 0.7) {
        probability *= 1.3;
        riskFactors.push(`Выработано ${Math.round(lifeRatio * 100)}% ресурса двигателя`);
        recommendations.push("Планировать капитальный ремонт или замену");
      }
    }

    // Ограничиваем вероятность 95%
    probability = Math.min(95, Math.max(0, probability));

    // Определяем уровень риска
    let riskLevel: FailurePrediction["riskLevel"] = "green";
    if (probability > 40) riskLevel = "red";
    else if (probability > 25) riskLevel = "orange";
    else if (probability > 10) riskLevel = "yellow";

    // Стандартные рекомендации по уровню риска
    if (riskLevel === "red" || riskLevel === "orange") {
      recommendations.push("Заказать запчасти заранее для минимизации простоя");
    }
    if (failure.fieldRepairable) {
      recommendations.push("Иметь ремкомплект в поле (можно устранить на месте)");
    }

    return {
      failureId: failure.id,
      name: failure.name,
      system: failure.system,
      probabilityNext500h: Math.round(probability * 10) / 10,
      baseProbability: failure.currentProbability,
      severity: failure.severity,
      riskLevel,
      repairCost: failure.repairCostRub,
      downtime: failure.downtimeDays,
      symptoms: failure.symptoms,
      recommendations: [...new Set(recommendations)],
      riskFactors,
      fieldRepairable: failure.fieldRepairable,
    };
  }).sort((a, b) => b.probabilityNext500h - a.probabilityNext500h);
}

// ═══════════════════════════════════════════════
// СВОДНЫЙ ОТЧЁТ ЗДОРОВЬЯ ТЕХНИКИ
// ═══════════════════════════════════════════════

export interface EquipmentHealthReport {
  /** Общий индекс здоровья 0-100 */
  healthIndex: number;
  /** Цвет индикатора */
  healthColor: "green" | "yellow" | "orange" | "red";
  /** Прогноз поломок */
  predictions: FailurePrediction[];
  /** Ближайшее ТО */
  nextMaintenance: { type: string; hoursRemaining: number; estimatedDate?: Date };
  /** Суммарный риск простоя (дней в ближайшие 1000 м/ч) */
  estimatedDowntimeDays: number;
  /** Ожидаемые затраты на ремонт, ₽ */
  estimatedRepairCostRub: number;
  /** Топ-3 рекомендации */
  topRecommendations: string[];
}

export function generateHealthReport(
  modelId: string,
  currentHours: number,
  avgHoursPerDay: number,
  regionId?: string,
  weather?: WeatherConditions,
  usage?: UsagePattern
): EquipmentHealthReport {
  const predictions = predictFailures(modelId, currentHours, regionId, weather, usage);
  const spec = findSpecById(modelId);

  // Индекс здоровья: 100 - сумма взвешенных рисков
  const riskSum = predictions.reduce((sum, p) => {
    const weight = p.severity === "critical" ? 2 : p.severity === "high" ? 1.5 : p.severity === "medium" ? 1 : 0.5;
    return sum + (p.probabilityNext500h / 100) * weight;
  }, 0);
  const healthIndex = Math.max(0, Math.min(100, Math.round(100 - riskSum * 20)));

  let healthColor: EquipmentHealthReport["healthColor"] = "green";
  if (healthIndex < 30) healthColor = "red";
  else if (healthIndex < 55) healthColor = "orange";
  else if (healthIndex < 75) healthColor = "yellow";

  // Ближайшее ТО
  let nextMaintenance = { type: "ТО-1", hoursRemaining: 60, estimatedDate: undefined as Date | undefined };
  if (spec) {
    const { to1Hours, to2Hours, to3Hours } = spec.maintenance;
    const candidates = [
      { type: "ТО-1", at: Math.ceil(currentHours / to1Hours) * to1Hours },
      { type: "ТО-2", at: Math.ceil(currentHours / to2Hours) * to2Hours },
      { type: "ТО-3", at: Math.ceil(currentHours / to3Hours) * to3Hours },
    ].map((c) => ({ ...c, remaining: c.at - currentHours })).filter((c) => c.remaining > 0);
    candidates.sort((a, b) => a.remaining - b.remaining);

    if (candidates[0]) {
      const daysUntil = avgHoursPerDay > 0 ? candidates[0].remaining / avgHoursPerDay : 30;
      nextMaintenance = {
        type: candidates[0].type,
        hoursRemaining: candidates[0].remaining,
        estimatedDate: new Date(Date.now() + daysUntil * 86_400_000),
      };
    }
  }

  // Ожидаемый простой и расходы
  const estimatedDowntimeDays = predictions.reduce(
    (sum, p) => sum + (p.probabilityNext500h / 100) * p.downtime.avg, 0
  );
  const estimatedRepairCostRub = predictions.reduce(
    (sum, p) => sum + (p.probabilityNext500h / 100) * p.repairCost.avg, 0
  );

  // Топ рекомендации
  const allRecs = predictions.flatMap((p) => p.recommendations);
  const topRecommendations = [...new Set(allRecs)].slice(0, 5);

  if (nextMaintenance.hoursRemaining < 50) {
    topRecommendations.unshift(`Запланировать ${nextMaintenance.type} через ${nextMaintenance.hoursRemaining} м/ч`);
  }

  return {
    healthIndex,
    healthColor,
    predictions,
    nextMaintenance,
    estimatedDowntimeDays: Math.round(estimatedDowntimeDays * 10) / 10,
    estimatedRepairCostRub: Math.round(estimatedRepairCostRub),
    topRecommendations: topRecommendations.slice(0, 5),
  };
}
