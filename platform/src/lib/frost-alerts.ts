/**
 * СИСТЕМА АЛЕРТОВ ЗАМОРОЗКОВ
 *
 * Анализирует прогноз погоды из MCP и генерирует предупреждения:
 * - Заморозки <0°C на поверхности почвы
 * - Критические заморозки <-3°C
 * - Опасный период для каждой культуры (фазы роста)
 */

export interface FrostAlert {
  severity: "warning" | "danger" | "critical";
  dateTime: string;
  minTemp: number;
  duration: number; // часов ниже 0°C
  affectedCrops: { crop: string; risk: string; action: string }[];
  recommendations: string[];
}

/** Критические температуры для культур по фазам */
const CROP_FROST_THRESHOLDS: Record<string, { seedling: number; flowering: number; heading: number; label: string }> = {
  "Пшеница озимая":   { seedling: -8,  flowering: -1, heading: -2,  label: "озимая пшеница" },
  "Пшеница яровая":   { seedling: -5,  flowering: -1, heading: -2,  label: "яровая пшеница" },
  "Ячмень яровой":    { seedling: -4,  flowering: -1, heading: -2,  label: "ячмень" },
  "Кукуруза":         { seedling: -1,  flowering: -1, heading: -2,  label: "кукуруза" },
  "Подсолнечник":     { seedling: -3,  flowering: -1, heading: -2,  label: "подсолнечник" },
  "Сахарная свёкла":  { seedling: -3,  flowering: -2, heading: -4,  label: "сахарная свёкла" },
  "Соя":              { seedling: -1,  flowering: -1, heading: -2,  label: "соя" },
  "Рапс":             { seedling: -5,  flowering: -2, heading: -3,  label: "рапс" },
  "Горох":            { seedling: -4,  flowering: -2, heading: -3,  label: "горох" },
  "Гречиха":          { seedling: -1,  flowering: -1, heading: -2,  label: "гречиха" },
};

/** Определить фазу развития по месяцу (упрощённо для ЦЧР) */
function getGrowthPhase(month: number, cropName: string): "seedling" | "flowering" | "heading" {
  const isWinter = cropName.includes("озимая") || cropName.includes("озимый");
  if (isWinter) {
    if (month >= 3 && month <= 4) return "seedling"; // весеннее возобновление
    if (month >= 5 && month <= 6) return "flowering";
    return "heading";
  }
  if (month >= 4 && month <= 5) return "seedling";
  if (month >= 6 && month <= 7) return "flowering";
  return "heading";
}

/**
 * Анализ прогноза на заморозки
 * @param hourlyForecast — почасовой прогноз из MCP
 * @param activeCrops — список культур, посеянных в полях
 */
export function analyzeFrostRisk(
  hourlyForecast: { time: string; temperature: number; soilTemperature?: number }[],
  activeCrops: string[]
): FrostAlert[] {
  const alerts: FrostAlert[] = [];
  let frostStart: string | null = null;
  let minTemp = 100;
  let frostHours = 0;

  for (let i = 0; i < hourlyForecast.length; i++) {
    const h = hourlyForecast[i];
    // Температура на поверхности почвы обычно на 2-3°C ниже воздуха ночью
    const hour = new Date(h.time).getHours();
    const surfaceTemp = h.soilTemperature ?? (hour >= 0 && hour <= 6 ? h.temperature - 2.5 : h.temperature - 1);

    if (surfaceTemp < 0) {
      if (!frostStart) frostStart = h.time;
      minTemp = Math.min(minTemp, surfaceTemp);
      frostHours++;
    } else if (frostStart) {
      // Конец заморозка — создаём алерт
      const severity = minTemp < -5 ? "critical" : minTemp < -2 ? "danger" : "warning";
      const month = new Date(frostStart).getMonth() + 1;

      const affectedCrops = activeCrops
        .filter((crop) => CROP_FROST_THRESHOLDS[crop])
        .map((crop) => {
          const thresholds = CROP_FROST_THRESHOLDS[crop];
          const phase = getGrowthPhase(month, crop);
          const threshold = thresholds[phase];
          const isAtRisk = minTemp < threshold;

          return {
            crop: thresholds.label,
            risk: isAtRisk
              ? `ОПАСНО: ${minTemp.toFixed(1)}°C < порог ${threshold}°C (фаза: ${phase === "seedling" ? "всходы" : phase === "flowering" ? "цветение" : "колошение"})`
              : `Допустимо: ${minTemp.toFixed(1)}°C > порог ${threshold}°C`,
            action: isAtRisk
              ? "Провести обследование посевов после заморозка. Возможна пересевка."
              : "Наблюдение. Повреждение маловероятно.",
          };
        });

      const recommendations: string[] = [];
      if (severity === "critical") {
        recommendations.push("Немедленно оценить состояние посевов");
        recommendations.push("Подготовить семена для пересева повреждённых участков");
        recommendations.push("Обратиться в страховую компанию для фиксации ущерба");
      } else if (severity === "danger") {
        recommendations.push("Провести обследование на следующий день");
        recommendations.push("При повреждении >50% — рассмотреть пересев");
      } else {
        recommendations.push("Визуальный контроль посевов через 2-3 дня");
      }

      alerts.push({
        severity,
        dateTime: frostStart,
        minTemp: Math.round(minTemp * 10) / 10,
        duration: frostHours,
        affectedCrops,
        recommendations,
      });

      frostStart = null;
      minTemp = 100;
      frostHours = 0;
    }
  }

  return alerts;
}
