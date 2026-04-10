/**
 * ПЛАНИРОВЩИК СЕВООБОРОТА
 *
 * Правила размещения культур:
 * - Подсолнечник: не чаще 1 раза в 5-7 лет на одном поле
 * - Сахарная свёкла: не чаще 1 раза в 3-4 года
 * - Пшеница по пшенице: допустимо 2 года, на 3-й падение урожая
 * - Бобовые (горох, соя) — лучший предшественник для пшеницы
 * - Кукуруза — хороший предшественник для пшеницы
 */

export interface RotationRule {
  crop: string;
  /** Минимальный перерыв (лет) перед повторным посевом */
  returnPeriod: number;
  /** Хорошие предшественники */
  goodPredecessors: string[];
  /** Допустимые предшественники */
  okPredecessors: string[];
  /** Плохие предшественники */
  badPredecessors: string[];
  /** Бонус урожайности после хороших предшественников, % */
  yieldBonusPct: number;
  /** Штраф урожайности после плохих предшественников, % */
  yieldPenaltyPct: number;
}

export const ROTATION_RULES: RotationRule[] = [
  {
    crop: "Пшеница озимая",
    returnPeriod: 2,
    goodPredecessors: ["Горох", "Соя", "Рапс", "Кукуруза", "Картофель"],
    okPredecessors: ["Ячмень яровой", "Сахарная свёкла", "Подсолнечник"],
    badPredecessors: ["Пшеница озимая", "Пшеница яровая", "Рожь"],
    yieldBonusPct: 15,
    yieldPenaltyPct: 25,
  },
  {
    crop: "Пшеница яровая",
    returnPeriod: 2,
    goodPredecessors: ["Горох", "Соя", "Рапс", "Картофель"],
    okPredecessors: ["Кукуруза", "Сахарная свёкла"],
    badPredecessors: ["Пшеница озимая", "Пшеница яровая", "Ячмень яровой"],
    yieldBonusPct: 12,
    yieldPenaltyPct: 20,
  },
  {
    crop: "Подсолнечник",
    returnPeriod: 7,
    goodPredecessors: ["Пшеница озимая", "Ячмень яровой", "Кукуруза"],
    okPredecessors: ["Пшеница яровая", "Рожь", "Овёс"],
    badPredecessors: ["Подсолнечник", "Рапс", "Соя", "Сахарная свёкла"],
    yieldBonusPct: 10,
    yieldPenaltyPct: 40,
  },
  {
    crop: "Кукуруза",
    returnPeriod: 2,
    goodPredecessors: ["Горох", "Соя", "Пшеница озимая", "Картофель"],
    okPredecessors: ["Ячмень яровой", "Подсолнечник"],
    badPredecessors: ["Кукуруза", "Просо"],
    yieldBonusPct: 12,
    yieldPenaltyPct: 15,
  },
  {
    crop: "Сахарная свёкла",
    returnPeriod: 4,
    goodPredecessors: ["Пшеница озимая", "Ячмень яровой"],
    okPredecessors: ["Горох", "Рожь"],
    badPredecessors: ["Сахарная свёкла", "Подсолнечник", "Рапс"],
    yieldBonusPct: 8,
    yieldPenaltyPct: 30,
  },
  {
    crop: "Горох",
    returnPeriod: 3,
    goodPredecessors: ["Пшеница озимая", "Кукуруза", "Ячмень яровой"],
    okPredecessors: ["Подсолнечник", "Рожь"],
    badPredecessors: ["Горох", "Соя", "Люцерна"],
    yieldBonusPct: 10,
    yieldPenaltyPct: 25,
  },
  {
    crop: "Соя",
    returnPeriod: 3,
    goodPredecessors: ["Пшеница озимая", "Кукуруза", "Ячмень яровой"],
    okPredecessors: ["Пшеница яровая"],
    badPredecessors: ["Соя", "Горох", "Подсолнечник"],
    yieldBonusPct: 10,
    yieldPenaltyPct: 20,
  },
  {
    crop: "Рапс",
    returnPeriod: 4,
    goodPredecessors: ["Пшеница озимая", "Ячмень яровой", "Горох"],
    okPredecessors: ["Кукуруза"],
    badPredecessors: ["Рапс", "Подсолнечник", "Сахарная свёкла"],
    yieldBonusPct: 10,
    yieldPenaltyPct: 30,
  },
  {
    crop: "Ячмень яровой",
    returnPeriod: 2,
    goodPredecessors: ["Горох", "Кукуруза", "Картофель", "Сахарная свёкла"],
    okPredecessors: ["Пшеница озимая", "Подсолнечник"],
    badPredecessors: ["Ячмень яровой", "Пшеница яровая", "Овёс"],
    yieldBonusPct: 10,
    yieldPenaltyPct: 20,
  },
];

export interface RotationValidation {
  crop: string;
  predecessor: string;
  /** Результат */
  status: "excellent" | "good" | "acceptable" | "bad" | "critical";
  /** Описание */
  message: string;
  /** Влияние на урожайность, % */
  yieldImpactPct: number;
  /** Рекомендация */
  recommendation?: string;
}

/** Проверить допустимость размещения культуры после предшественника */
export function validateRotation(crop: string, predecessor: string, history: { year: number; crop: string }[]): RotationValidation {
  const rule = ROTATION_RULES.find((r) => r.crop === crop);

  if (!rule) {
    return { crop, predecessor, status: "acceptable", message: "Нет данных о правилах размещения", yieldImpactPct: 0 };
  }

  // Проверка периода возврата
  const lastSameYear = history.find((h) => h.crop === crop);
  if (lastSameYear) {
    const yearsSince = new Date().getFullYear() - lastSameYear.year;
    if (yearsSince < rule.returnPeriod) {
      return {
        crop, predecessor,
        status: "critical",
        message: `${crop} был на этом поле ${yearsSince} г. назад. Минимум ${rule.returnPeriod} лет!`,
        yieldImpactPct: -rule.yieldPenaltyPct,
        recommendation: `Подождите ещё ${rule.returnPeriod - yearsSince} лет или выберите другую культуру`,
      };
    }
  }

  // Проверка предшественника
  if (rule.goodPredecessors.includes(predecessor)) {
    return {
      crop, predecessor,
      status: "excellent",
      message: `${predecessor} — отличный предшественник для ${crop}`,
      yieldImpactPct: rule.yieldBonusPct,
    };
  }

  if (rule.okPredecessors.includes(predecessor)) {
    return {
      crop, predecessor,
      status: "good",
      message: `${predecessor} — допустимый предшественник`,
      yieldImpactPct: 0,
    };
  }

  if (rule.badPredecessors.includes(predecessor)) {
    return {
      crop, predecessor,
      status: "bad",
      message: `${predecessor} — нежелательный предшественник для ${crop}`,
      yieldImpactPct: -rule.yieldPenaltyPct,
      recommendation: `Рекомендуемые предшественники: ${rule.goodPredecessors.join(", ")}`,
    };
  }

  return {
    crop, predecessor,
    status: "acceptable",
    message: `${predecessor} — нейтральный предшественник`,
    yieldImpactPct: -5,
  };
}

/** Предложить лучшие культуры для поля на следующий год */
export function suggestCrops(predecessor: string, history: { year: number; crop: string }[]): { crop: string; rating: number; message: string }[] {
  const currentYear = new Date().getFullYear();

  return ROTATION_RULES
    .map((rule) => {
      const lastSame = history.find((h) => h.crop === rule.crop);
      const yearsSince = lastSame ? currentYear - lastSame.year : 999;

      if (yearsSince < rule.returnPeriod) {
        return { crop: rule.crop, rating: 0, message: `Нельзя: был ${yearsSince} г. назад (мин. ${rule.returnPeriod})` };
      }

      let rating = 50;
      if (rule.goodPredecessors.includes(predecessor)) rating = 90 + rule.yieldBonusPct;
      else if (rule.okPredecessors.includes(predecessor)) rating = 70;
      else if (rule.badPredecessors.includes(predecessor)) rating = 20;

      const message = rule.goodPredecessors.includes(predecessor)
        ? `Отлично после ${predecessor} (+${rule.yieldBonusPct}% урожай)`
        : rule.badPredecessors.includes(predecessor)
          ? `Нежелательно после ${predecessor}`
          : `Допустимо после ${predecessor}`;

      return { crop: rule.crop, rating, message };
    })
    .filter((s) => s.rating > 0)
    .sort((a, b) => b.rating - a.rating);
}
