/**
 * КАЛЬКУЛЯТОР ОКНА ОПРЫСКИВАНИЯ
 *
 * Определяет можно ли проводить опрыскивание на основе:
 * - Скорость ветра (<5 м/с обязательно, <3 м/с идеально)
 * - Температура (10-25°C оптимально, не ниже 5°C, не выше 30°C)
 * - Отсутствие дождя 4 часа после обработки
 * - Влажность воздуха (>40%, <95%)
 * - Время суток (раннее утро или вечер — лучше)
 *
 * Использует данные из MCP-сервера (get_weather_forecast)
 */

export interface SprayConditions {
  temperature: number;     // °C
  windSpeed: number;       // м/с
  humidity: number;        // %
  precipitationMm: number; // мм за ближайшие 4 часа
  hour: number;            // Час (0-23)
}

export interface SprayWindowResult {
  /** Можно ли опрыскивать */
  canSpray: boolean;
  /** Общая оценка 0-100 */
  score: number;
  /** Цвет индикатора */
  color: "green" | "yellow" | "red";
  /** Причины запрета/ограничения */
  warnings: string[];
  /** Рекомендации */
  recommendations: string[];
  /** Оценка по факторам */
  factors: {
    wind: { value: number; status: "ok" | "warning" | "critical"; label: string };
    temperature: { value: number; status: "ok" | "warning" | "critical"; label: string };
    rain: { value: number; status: "ok" | "warning" | "critical"; label: string };
    humidity: { value: number; status: "ok" | "warning" | "critical"; label: string };
    timeOfDay: { value: number; status: "ok" | "warning" | "critical"; label: string };
  };
}

export function evaluateSprayWindow(conditions: SprayConditions): SprayWindowResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // ── Ветер ──
  let windStatus: "ok" | "warning" | "critical" = "ok";
  let windLabel = `${conditions.windSpeed} м/с — отлично`;
  if (conditions.windSpeed > 5) {
    windStatus = "critical";
    windLabel = `${conditions.windSpeed} м/с — ЗАПРЕТ`;
    warnings.push("Ветер выше 5 м/с — опрыскивание запрещено (снос препарата)");
    score -= 50;
  } else if (conditions.windSpeed > 3) {
    windStatus = "warning";
    windLabel = `${conditions.windSpeed} м/с — осторожно`;
    warnings.push("Ветер 3-5 м/с — снижение качества обработки, возможен снос");
    recommendations.push("Снизить высоту штанги, увеличить размер капель");
    score -= 20;
  } else if (conditions.windSpeed < 1) {
    windStatus = "warning";
    windLabel = `${conditions.windSpeed} м/с — штиль (инверсия)`;
    warnings.push("Штиль — риск температурной инверсии, капли зависают в воздухе");
    score -= 10;
  }

  // ── Температура ──
  let tempStatus: "ok" | "warning" | "critical" = "ok";
  let tempLabel = `${conditions.temperature}°C — оптимально`;
  if (conditions.temperature < 5) {
    tempStatus = "critical";
    tempLabel = `${conditions.temperature}°C — слишком холодно`;
    warnings.push("Температура ниже 5°C — препарат не усваивается растениями");
    score -= 40;
  } else if (conditions.temperature > 30) {
    tempStatus = "critical";
    tempLabel = `${conditions.temperature}°C — слишком жарко`;
    warnings.push("Температура выше 30°C — быстрое испарение, ожоги растений");
    score -= 40;
  } else if (conditions.temperature < 10) {
    tempStatus = "warning";
    tempLabel = `${conditions.temperature}°C — прохладно`;
    warnings.push("Температура 5-10°C — снижение эффективности гербицидов");
    score -= 15;
  } else if (conditions.temperature > 25) {
    tempStatus = "warning";
    tempLabel = `${conditions.temperature}°C — жарковато`;
    recommendations.push("Работать рано утром до 10:00 или вечером после 18:00");
    score -= 10;
  }

  // ── Дождь ──
  let rainStatus: "ok" | "warning" | "critical" = "ok";
  let rainLabel = "Нет осадков";
  if (conditions.precipitationMm > 2) {
    rainStatus = "critical";
    rainLabel = `${conditions.precipitationMm} мм — дождь`;
    warnings.push("Ожидается дождь — препарат будет смыт с растений");
    score -= 50;
  } else if (conditions.precipitationMm > 0) {
    rainStatus = "warning";
    rainLabel = `${conditions.precipitationMm} мм — морось`;
    warnings.push("Возможна морось — снижение эффективности обработки");
    score -= 20;
  }

  // ── Влажность ──
  let humStatus: "ok" | "warning" | "critical" = "ok";
  let humLabel = `${conditions.humidity}% — норма`;
  if (conditions.humidity < 40) {
    humStatus = "warning";
    humLabel = `${conditions.humidity}% — сухо`;
    warnings.push("Низкая влажность — быстрое испарение капель");
    recommendations.push("Увеличить норму расхода рабочего раствора");
    score -= 15;
  } else if (conditions.humidity > 95) {
    humStatus = "warning";
    humLabel = `${conditions.humidity}% — роса`;
    warnings.push("Высокая влажность / роса — разбавление препарата");
    score -= 10;
  }

  // ── Время суток ──
  let timeStatus: "ok" | "warning" | "critical" = "ok";
  let timeLabel = "Оптимальное время";
  if (conditions.hour >= 5 && conditions.hour <= 9) {
    timeLabel = "Раннее утро — идеально";
  } else if (conditions.hour >= 18 && conditions.hour <= 21) {
    timeLabel = "Вечер — хорошо";
  } else if (conditions.hour >= 11 && conditions.hour <= 16) {
    timeStatus = "warning";
    timeLabel = "Полдень — нежелательно";
    recommendations.push("Лучше работать утром (5-9) или вечером (18-21)");
    score -= 10;
  } else if (conditions.hour < 5 || conditions.hour > 21) {
    timeStatus = "warning";
    timeLabel = "Ночь — темно";
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));
  const canSpray = score >= 50 && windStatus !== "critical" && tempStatus !== "critical" && rainStatus !== "critical";
  const color = score >= 70 ? "green" : score >= 50 ? "yellow" : "red";

  if (canSpray && score >= 80) {
    recommendations.push("Отличные условия для опрыскивания!");
  }

  return {
    canSpray,
    score,
    color,
    warnings,
    recommendations,
    factors: {
      wind: { value: conditions.windSpeed, status: windStatus, label: windLabel },
      temperature: { value: conditions.temperature, status: tempStatus, label: tempLabel },
      rain: { value: conditions.precipitationMm, status: rainStatus, label: rainLabel },
      humidity: { value: conditions.humidity, status: humStatus, label: humLabel },
      timeOfDay: { value: conditions.hour, status: timeStatus, label: timeLabel },
    },
  };
}

/**
 * Найти оптимальные окна опрыскивания в прогнозе на 7 дней
 * hourlyForecast — массив почасовых прогнозов из MCP
 */
export function findSprayWindows(
  hourlyForecast: { time: string; temperature: number; windSpeed: number; humidity: number; precipitation: number }[]
): { start: string; end: string; score: number; avgTemp: number; avgWind: number }[] {
  const windows: { start: string; end: string; score: number; avgTemp: number; avgWind: number }[] = [];
  let windowStart: string | null = null;
  let windowScores: number[] = [];
  let temps: number[] = [];
  let winds: number[] = [];

  for (let i = 0; i < hourlyForecast.length; i++) {
    const h = hourlyForecast[i];
    const hour = new Date(h.time).getHours();
    const rainNext4h = hourlyForecast.slice(i, i + 4).reduce((s, f) => s + f.precipitation, 0);

    const result = evaluateSprayWindow({
      temperature: h.temperature,
      windSpeed: h.windSpeed,
      humidity: h.humidity,
      precipitationMm: rainNext4h,
      hour,
    });

    if (result.canSpray && result.score >= 60) {
      if (!windowStart) windowStart = h.time;
      windowScores.push(result.score);
      temps.push(h.temperature);
      winds.push(h.windSpeed);
    } else {
      if (windowStart && windowScores.length >= 2) {
        windows.push({
          start: windowStart,
          end: hourlyForecast[i - 1].time,
          score: Math.round(windowScores.reduce((a, b) => a + b, 0) / windowScores.length),
          avgTemp: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10,
          avgWind: Math.round(winds.reduce((a, b) => a + b, 0) / winds.length * 10) / 10,
        });
      }
      windowStart = null;
      windowScores = [];
      temps = [];
      winds = [];
    }
  }

  return windows.sort((a, b) => b.score - a.score);
}
