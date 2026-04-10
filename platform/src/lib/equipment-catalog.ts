/**
 * ПОЛНЫЙ СПРАВОЧНИК СЕЛЬХОЗТЕХНИКИ (Россия / Беларусь / Китай)
 *
 * Используется для:
 * - Автоподстановки ТТХ при добавлении техники
 * - Расчёта запаса хода (бак / расход = часы работы)
 * - Планирования: производительность × площадь = время
 * - Расчёта расхода ГСМ на задачу: расход л/га × площадь
 * - Планирования ТО: моточасы → дата следующего ТО
 * - Ценообразования маркетплейса
 */

// ═══════════════════════════════════════════════
// Типы
// ═══════════════════════════════════════════════

export interface EquipmentSpec {
  /** Идентификатор модели */
  id: string;
  /** Производитель */
  make: string;
  /** Модель */
  model: string;
  /** Страна */
  country: "Россия" | "Беларусь" | "Китай";
  /** Город производства */
  city: string;
  /** Категория */
  category: string;
  /** Год начала производства */
  productionYearStart: number;
  /** Цена новой (₽) */
  priceNewRub: number;

  // ── Двигатель ──
  engine: {
    /** Марка двигателя */
    brand: string;
    /** Модель двигателя */
    model: string;
    /** Мощность, л.с. */
    horsePower: number;
    /** Мощность, кВт */
    kW: number;
    /** Число цилиндров */
    cylinders: number;
    /** Рабочий объём, л */
    displacementL: number;
    /** Тип топлива */
    fuelType: "diesel" | "gasoline" | "gas" | "electric";
    /** Удельный расход, г/кВт·ч */
    specificConsumptionGkWh: number;
  };

  // ── Топливо ──
  fuel: {
    /** Объём бака, л */
    tankCapacityL: number;
    /** Средний расход, л/ч (при средней нагрузке) */
    avgConsumptionLPerHour: number;
    /** Расход при макс нагрузке, л/ч */
    maxConsumptionLPerHour: number;
    /** Запас хода по топливу при средней нагрузке, ч */
    autonomyHours: number;
  };

  // ── Масса и габариты ──
  dimensions: {
    /** Эксплуатационная масса, кг */
    weightKg: number;
    /** Длина, мм */
    lengthMm: number;
    /** Ширина, мм */
    widthMm: number;
    /** Высота, мм */
    heightMm: number;
    /** Дорожный просвет, мм */
    groundClearanceMm?: number;
  };

  // ── Производительность (для планирования) ──
  performance: {
    /** Ширина захвата, м (для прицепного — с орудием) */
    workingWidthM?: number;
    /** Производительность, га/ч (основное время) */
    productivityHaPerHour?: number;
    /** Производительность, т/ч (для комбайнов) */
    productivityTonPerHour?: number;
    /** Объём бункера, л (для комбайнов) */
    hopperCapacityL?: number;
    /** Скорость выгрузки, л/с (для комбайнов) */
    unloadingSpeedLPerSec?: number;
    /** Грузоподъёмность, кг (для грузовиков) */
    payloadKg?: number;
    /** Рабочая скорость, км/ч */
    workingSpeedKmh?: number;
    /** Транспортная скорость, км/ч */
    transportSpeedKmh?: number;
    /** Тяговый класс */
    tractionClass?: number;
  };

  // ── Нормы расхода ГСМ по видам работ (л/га) ──
  fuelPerHa?: {
    plowing?: number;       // Вспашка
    cultivation?: number;   // Культивация
    seeding?: number;       // Посев
    spraying?: number;      // Опрыскивание
    harvesting?: number;    // Уборка
    transport?: number;     // Транспортировка (л/100км)
  };

  // ── ТО (техническое обслуживание) ──
  maintenance: {
    /** ТО-1 через, моточасов */
    to1Hours: number;
    /** ТО-2 через, моточасов */
    to2Hours: number;
    /** ТО-3 через, моточасов */
    to3Hours: number;
    /** Капремонт через, моточасов */
    overhaul: number;
    /** Стоимость ТО-1, ₽ */
    to1CostRub: number;
    /** Стоимость ТО-2, ₽ */
    to2CostRub: number;
    /** Стоимость ТО-3, ₽ */
    to3CostRub: number;
    /** Ресурс двигателя, моточасов */
    engineLifeHours: number;
  };
}

// ═══════════════════════════════════════════════
// ТРАКТОРЫ
// ═══════════════════════════════════════════════

export const TRACTORS: EquipmentSpec[] = [
  {
    id: "kirovets-k7m-300",
    make: "ПТЗ", model: "Кировец К-7М (300 л.с.)",
    country: "Россия", city: "Санкт-Петербург", category: "TRACTOR",
    productionYearStart: 2018, priceNewRub: 10_500_000,
    engine: { brand: "ТМЗ", model: "8481.10", horsePower: 300, kW: 221, cylinders: 8, displacementL: 17.24, fuelType: "diesel", specificConsumptionGkWh: 213 },
    fuel: { tankCapacityL: 800, avgConsumptionLPerHour: 38, maxConsumptionLPerHour: 55, autonomyHours: 21 },
    dimensions: { weightKg: 15200, lengthMm: 7400, widthMm: 3050, heightMm: 3385, groundClearanceMm: 460 },
    performance: { tractionClass: 5, workingSpeedKmh: 12, transportSpeedKmh: 33 },
    fuelPerHa: { plowing: 22, cultivation: 10, seeding: 9 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 10000, to1CostRub: 15000, to2CostRub: 45000, to3CostRub: 120000, engineLifeHours: 12000 },
  },
  {
    id: "kirovets-k7m-420",
    make: "ПТЗ", model: "Кировец К-7М (420 л.с.)",
    country: "Россия", city: "Санкт-Петербург", category: "TRACTOR",
    productionYearStart: 2020, priceNewRub: 14_200_000,
    engine: { brand: "ТМЗ", model: "8486.10", horsePower: 420, kW: 309, cylinders: 8, displacementL: 17.24, fuelType: "diesel", specificConsumptionGkWh: 210 },
    fuel: { tankCapacityL: 800, avgConsumptionLPerHour: 48, maxConsumptionLPerHour: 72, autonomyHours: 17 },
    dimensions: { weightKg: 18800, lengthMm: 7400, widthMm: 3050, heightMm: 3385, groundClearanceMm: 460 },
    performance: { tractionClass: 5, workingSpeedKmh: 12, transportSpeedKmh: 33 },
    fuelPerHa: { plowing: 18, cultivation: 8, seeding: 7 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 10000, to1CostRub: 18000, to2CostRub: 55000, to3CostRub: 150000, engineLifeHours: 12000 },
  },
  {
    id: "mtz-82-1",
    make: "МТЗ", model: "БЕЛАРУС-82.1",
    country: "Беларусь", city: "Минск", category: "TRACTOR",
    productionYearStart: 1995, priceNewRub: 2_680_000,
    engine: { brand: "ММЗ", model: "Д-243", horsePower: 81, kW: 60, cylinders: 4, displacementL: 4.75, fuelType: "diesel", specificConsumptionGkWh: 226 },
    fuel: { tankCapacityL: 130, avgConsumptionLPerHour: 7, maxConsumptionLPerHour: 12, autonomyHours: 18 },
    dimensions: { weightKg: 3820, lengthMm: 3815, widthMm: 1970, heightMm: 2780, groundClearanceMm: 465 },
    performance: { tractionClass: 1.4, workingSpeedKmh: 10, transportSpeedKmh: 34 },
    fuelPerHa: { plowing: 16, cultivation: 8, seeding: 7, spraying: 3 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 6000, to1CostRub: 5000, to2CostRub: 18000, to3CostRub: 45000, engineLifeHours: 8000 },
  },
  {
    id: "mtz-1221-2",
    make: "МТЗ", model: "БЕЛАРУС-1221.2",
    country: "Беларусь", city: "Минск", category: "TRACTOR",
    productionYearStart: 2004, priceNewRub: 4_800_000,
    engine: { brand: "ММЗ", model: "Д-260.2С", horsePower: 130, kW: 96, cylinders: 6, displacementL: 7.12, fuelType: "diesel", specificConsumptionGkWh: 226 },
    fuel: { tankCapacityL: 160, avgConsumptionLPerHour: 12, maxConsumptionLPerHour: 20, autonomyHours: 13 },
    dimensions: { weightKg: 5730, lengthMm: 4620, widthMm: 2260, heightMm: 2895, groundClearanceMm: 465 },
    performance: { tractionClass: 2, workingSpeedKmh: 12, transportSpeedKmh: 33 },
    fuelPerHa: { plowing: 18, cultivation: 9, seeding: 8, spraying: 4 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 8000, to1CostRub: 8000, to2CostRub: 25000, to3CostRub: 65000, engineLifeHours: 10000 },
  },
  {
    id: "mtz-3022",
    make: "МТЗ", model: "БЕЛАРУС-3022",
    country: "Беларусь", city: "Минск", category: "TRACTOR",
    productionYearStart: 2008, priceNewRub: 10_500_000,
    engine: { brand: "DEUTZ", model: "BF06M1013FC", horsePower: 303, kW: 223, cylinders: 6, displacementL: 7.15, fuelType: "diesel", specificConsumptionGkWh: 248 },
    fuel: { tankCapacityL: 500, avgConsumptionLPerHour: 35, maxConsumptionLPerHour: 55, autonomyHours: 14 },
    dimensions: { weightKg: 11500, lengthMm: 6100, widthMm: 2630, heightMm: 3150, groundClearanceMm: 450 },
    performance: { tractionClass: 5, workingSpeedKmh: 12, transportSpeedKmh: 40 },
    fuelPerHa: { plowing: 20, cultivation: 10, seeding: 8 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 10000, to1CostRub: 15000, to2CostRub: 42000, to3CostRub: 110000, engineLifeHours: 12000 },
  },
  {
    id: "mtz-3522",
    make: "МТЗ", model: "БЕЛАРУС-3522",
    country: "Беларусь", city: "Минск", category: "TRACTOR",
    productionYearStart: 2021, priceNewRub: 13_000_000,
    engine: { brand: "DEUTZ", model: "TCD2013 L06 4V", horsePower: 355, kW: 261, cylinders: 6, displacementL: 7.15, fuelType: "diesel", specificConsumptionGkWh: 240 },
    fuel: { tankCapacityL: 600, avgConsumptionLPerHour: 42, maxConsumptionLPerHour: 65, autonomyHours: 14 },
    dimensions: { weightKg: 12500, lengthMm: 6350, widthMm: 2630, heightMm: 3200, groundClearanceMm: 450 },
    performance: { tractionClass: 5, workingSpeedKmh: 12, transportSpeedKmh: 40 },
    fuelPerHa: { plowing: 18, cultivation: 9, seeding: 7 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 10000, to1CostRub: 18000, to2CostRub: 50000, to3CostRub: 130000, engineLifeHours: 12000 },
  },
  {
    id: "rsm-2375",
    make: "Ростсельмаш", model: "RSM 2375",
    country: "Россия", city: "Ростов-на-Дону", category: "TRACTOR",
    productionYearStart: 2022, priceNewRub: 16_000_000,
    engine: { brand: "Cummins", model: "QSL9", horsePower: 380, kW: 280, cylinders: 6, displacementL: 8.9, fuelType: "diesel", specificConsumptionGkWh: 210 },
    fuel: { tankCapacityL: 681, avgConsumptionLPerHour: 40, maxConsumptionLPerHour: 62, autonomyHours: 17 },
    dimensions: { weightKg: 14500, lengthMm: 6850, widthMm: 2990, heightMm: 3350, groundClearanceMm: 470 },
    performance: { tractionClass: 5, workingSpeedKmh: 12, transportSpeedKmh: 40 },
    fuelPerHa: { plowing: 19, cultivation: 9, seeding: 7 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 10000, to1CostRub: 20000, to2CostRub: 55000, to3CostRub: 140000, engineLifeHours: 12000 },
  },
  {
    id: "terrion-atm-7360",
    make: "Агротехмаш", model: "Terrion ATM 7360",
    country: "Россия", city: "Тамбов", category: "TRACTOR",
    productionYearStart: 2015, priceNewRub: 15_000_000,
    engine: { brand: "Sisu", model: "84CTA-4V", horsePower: 360, kW: 265, cylinders: 6, displacementL: 8.4, fuelType: "diesel", specificConsumptionGkWh: 215 },
    fuel: { tankCapacityL: 700, avgConsumptionLPerHour: 38, maxConsumptionLPerHour: 58, autonomyHours: 18 },
    dimensions: { weightKg: 14200, lengthMm: 6640, widthMm: 2900, heightMm: 3350, groundClearanceMm: 450 },
    performance: { tractionClass: 5, workingSpeedKmh: 12, transportSpeedKmh: 40 },
    fuelPerHa: { plowing: 19, cultivation: 9, seeding: 8 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 10000, to1CostRub: 18000, to2CostRub: 50000, to3CostRub: 130000, engineLifeHours: 12000 },
  },
  {
    id: "btz-243k",
    make: "БТЗ", model: "БТЗ-243К",
    country: "Россия", city: "Брянск", category: "TRACTOR",
    productionYearStart: 2022, priceNewRub: 7_800_000,
    engine: { brand: "ЯМЗ", model: "53645", horsePower: 240, kW: 176, cylinders: 4, displacementL: 4.43, fuelType: "diesel", specificConsumptionGkWh: 220 },
    fuel: { tankCapacityL: 400, avgConsumptionLPerHour: 25, maxConsumptionLPerHour: 40, autonomyHours: 16 },
    dimensions: { weightKg: 9500, lengthMm: 5500, widthMm: 2500, heightMm: 3100, groundClearanceMm: 400 },
    performance: { tractionClass: 3, workingSpeedKmh: 12, transportSpeedKmh: 35 },
    fuelPerHa: { plowing: 20, cultivation: 10, seeding: 8 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 8000, to1CostRub: 12000, to2CostRub: 35000, to3CostRub: 90000, engineLifeHours: 10000 },
  },
  {
    id: "agromash-180tk",
    make: "АГРОМАШ", model: "Агромаш-180ТК",
    country: "Россия", city: "Чебоксары", category: "TRACTOR",
    productionYearStart: 2020, priceNewRub: 6_200_000,
    engine: { brand: "Cummins", model: "6BTA 5.9", horsePower: 180, kW: 132, cylinders: 6, displacementL: 5.9, fuelType: "diesel", specificConsumptionGkWh: 225 },
    fuel: { tankCapacityL: 300, avgConsumptionLPerHour: 18, maxConsumptionLPerHour: 30, autonomyHours: 17 },
    dimensions: { weightKg: 7800, lengthMm: 5200, widthMm: 2400, heightMm: 3050, groundClearanceMm: 380 },
    performance: { tractionClass: 3, workingSpeedKmh: 12, transportSpeedKmh: 30 },
    fuelPerHa: { plowing: 19, cultivation: 9, seeding: 8 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 8000, to1CostRub: 10000, to2CostRub: 30000, to3CostRub: 80000, engineLifeHours: 10000 },
  },
  {
    id: "lovol-tg2054",
    make: "Lovol", model: "Lovol TG2054",
    country: "Китай", city: "Вэйфан", category: "TRACTOR",
    productionYearStart: 2023, priceNewRub: 5_800_000,
    engine: { brand: "Lovol", model: "Perkins 1104D", horsePower: 205, kW: 151, cylinders: 4, displacementL: 4.4, fuelType: "diesel", specificConsumptionGkWh: 230 },
    fuel: { tankCapacityL: 260, avgConsumptionLPerHour: 20, maxConsumptionLPerHour: 35, autonomyHours: 13 },
    dimensions: { weightKg: 7200, lengthMm: 5100, widthMm: 2350, heightMm: 2950, groundClearanceMm: 400 },
    performance: { tractionClass: 3, workingSpeedKmh: 10, transportSpeedKmh: 35 },
    fuelPerHa: { plowing: 20, cultivation: 10, seeding: 8 },
    maintenance: { to1Hours: 100, to2Hours: 400, to3Hours: 800, overhaul: 6000, to1CostRub: 8000, to2CostRub: 25000, to3CostRub: 65000, engineLifeHours: 8000 },
  },
];

// ═══════════════════════════════════════════════
// ЗЕРНОУБОРОЧНЫЕ КОМБАЙНЫ
// ═══════════════════════════════════════════════

export const GRAIN_COMBINES: EquipmentSpec[] = [
  {
    id: "acros-595-plus",
    make: "Ростсельмаш", model: "ACROS 595 Plus",
    country: "Россия", city: "Ростов-на-Дону", category: "GRAIN_COMBINE",
    productionYearStart: 2020, priceNewRub: 12_000_000,
    engine: { brand: "ЯМЗ", model: "53645-10", horsePower: 327, kW: 240, cylinders: 4, displacementL: 4.43, fuelType: "diesel", specificConsumptionGkWh: 210 },
    fuel: { tankCapacityL: 540, avgConsumptionLPerHour: 28, maxConsumptionLPerHour: 42, autonomyHours: 14 },
    dimensions: { weightKg: 14200, lengthMm: 8900, widthMm: 3540, heightMm: 3900 },
    performance: { productivityTonPerHour: 20, productivityHaPerHour: 4.5, hopperCapacityL: 9000, unloadingSpeedLPerSec: 90, workingWidthM: 7, workingSpeedKmh: 8, transportSpeedKmh: 20 },
    fuelPerHa: { harvesting: 7 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 6000, to1CostRub: 15000, to2CostRub: 45000, to3CostRub: 120000, engineLifeHours: 8000 },
  },
  {
    id: "acros-550",
    make: "Ростсельмаш", model: "ACROS 550",
    country: "Россия", city: "Ростов-на-Дону", category: "GRAIN_COMBINE",
    productionYearStart: 2016, priceNewRub: 8_500_000,
    engine: { brand: "ЯМЗ", model: "236НД-3", horsePower: 280, kW: 206, cylinders: 6, displacementL: 11.15, fuelType: "diesel", specificConsumptionGkWh: 218 },
    fuel: { tankCapacityL: 540, avgConsumptionLPerHour: 25, maxConsumptionLPerHour: 38, autonomyHours: 16 },
    dimensions: { weightKg: 13500, lengthMm: 8500, widthMm: 3450, heightMm: 3900 },
    performance: { productivityTonPerHour: 16, productivityHaPerHour: 3.8, hopperCapacityL: 9000, unloadingSpeedLPerSec: 90, workingWidthM: 7, workingSpeedKmh: 7, transportSpeedKmh: 20 },
    fuelPerHa: { harvesting: 8 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 6000, to1CostRub: 12000, to2CostRub: 40000, to3CostRub: 100000, engineLifeHours: 8000 },
  },
  {
    id: "torum-785",
    make: "Ростсельмаш", model: "TORUM 785",
    country: "Россия", city: "Ростов-на-Дону", category: "GRAIN_COMBINE",
    productionYearStart: 2021, priceNewRub: 24_000_000,
    engine: { brand: "MTU", model: "OM460LA", horsePower: 510, kW: 375, cylinders: 6, displacementL: 12.8, fuelType: "diesel", specificConsumptionGkWh: 200 },
    fuel: { tankCapacityL: 1100, avgConsumptionLPerHour: 45, maxConsumptionLPerHour: 70, autonomyHours: 24 },
    dimensions: { weightKg: 21000, lengthMm: 11500, widthMm: 4050, heightMm: 4000 },
    performance: { productivityTonPerHour: 45, productivityHaPerHour: 8, hopperCapacityL: 12000, unloadingSpeedLPerSec: 120, workingWidthM: 9, workingSpeedKmh: 9, transportSpeedKmh: 25 },
    fuelPerHa: { harvesting: 6 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 8000, to1CostRub: 25000, to2CostRub: 75000, to3CostRub: 200000, engineLifeHours: 10000 },
  },
  {
    id: "torum-750",
    make: "Ростсельмаш", model: "TORUM 750",
    country: "Россия", city: "Ростов-на-Дону", category: "GRAIN_COMBINE",
    productionYearStart: 2018, priceNewRub: 18_500_000,
    engine: { brand: "MTU", model: "OM460LA", horsePower: 425, kW: 313, cylinders: 6, displacementL: 12.8, fuelType: "diesel", specificConsumptionGkWh: 205 },
    fuel: { tankCapacityL: 850, avgConsumptionLPerHour: 38, maxConsumptionLPerHour: 60, autonomyHours: 22 },
    dimensions: { weightKg: 18500, lengthMm: 10800, widthMm: 3900, heightMm: 3950 },
    performance: { productivityTonPerHour: 24, productivityHaPerHour: 5.5, hopperCapacityL: 10500, unloadingSpeedLPerSec: 105, workingWidthM: 9, workingSpeedKmh: 8, transportSpeedKmh: 22 },
    fuelPerHa: { harvesting: 7 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 8000, to1CostRub: 22000, to2CostRub: 65000, to3CostRub: 180000, engineLifeHours: 10000 },
  },
  {
    id: "nova-s300",
    make: "Ростсельмаш", model: "NOVA S300",
    country: "Россия", city: "Ростов-на-Дону", category: "GRAIN_COMBINE",
    productionYearStart: 2021, priceNewRub: 5_800_000,
    engine: { brand: "ЯМЗ", model: "53405", horsePower: 180, kW: 132, cylinders: 4, displacementL: 4.43, fuelType: "diesel", specificConsumptionGkWh: 193 },
    fuel: { tankCapacityL: 300, avgConsumptionLPerHour: 15, maxConsumptionLPerHour: 25, autonomyHours: 20 },
    dimensions: { weightKg: 10500, lengthMm: 7800, widthMm: 3200, heightMm: 3700 },
    performance: { productivityTonPerHour: 10, productivityHaPerHour: 2.5, hopperCapacityL: 4500, unloadingSpeedLPerSec: 40, workingWidthM: 5, workingSpeedKmh: 6, transportSpeedKmh: 20 },
    fuelPerHa: { harvesting: 8 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 6000, to1CostRub: 10000, to2CostRub: 30000, to3CostRub: 80000, engineLifeHours: 8000 },
  },
  {
    id: "palesse-gs12a1",
    make: "Гомсельмаш", model: "Палессе GS12A1",
    country: "Беларусь", city: "Гомель", category: "GRAIN_COMBINE",
    productionYearStart: 2018, priceNewRub: 14_000_000,
    engine: { brand: "ЯМЗ", model: "658.10", horsePower: 330, kW: 243, cylinders: 6, displacementL: 14.86, fuelType: "diesel", specificConsumptionGkWh: 215 },
    fuel: { tankCapacityL: 600, avgConsumptionLPerHour: 30, maxConsumptionLPerHour: 48, autonomyHours: 20 },
    dimensions: { weightKg: 15500, lengthMm: 9500, widthMm: 3600, heightMm: 3900 },
    performance: { productivityTonPerHour: 18, productivityHaPerHour: 4, hopperCapacityL: 8000, unloadingSpeedLPerSec: 80, workingWidthM: 7, workingSpeedKmh: 7, transportSpeedKmh: 20 },
    fuelPerHa: { harvesting: 8 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 6000, to1CostRub: 14000, to2CostRub: 42000, to3CostRub: 110000, engineLifeHours: 8000 },
  },
];

// ═══════════════════════════════════════════════
// ОПРЫСКИВАТЕЛИ
// ═══════════════════════════════════════════════

export const SPRAYERS: EquipmentSpec[] = [
  {
    id: "tuman-2m",
    make: "Пегас-Агро", model: "Туман-2М",
    country: "Россия", city: "Самара", category: "SPRAYER",
    productionYearStart: 2020, priceNewRub: 5_800_000,
    engine: { brand: "ГАЗ", model: "Evotech", horsePower: 120, kW: 88, cylinders: 4, displacementL: 3.0, fuelType: "gasoline", specificConsumptionGkWh: 280 },
    fuel: { tankCapacityL: 60, avgConsumptionLPerHour: 12, maxConsumptionLPerHour: 18, autonomyHours: 5 },
    dimensions: { weightKg: 3500, lengthMm: 5500, widthMm: 2200, heightMm: 2800 },
    performance: { workingWidthM: 28, productivityHaPerHour: 35, workingSpeedKmh: 25, transportSpeedKmh: 40 },
    fuelPerHa: { spraying: 0.5 },
    maintenance: { to1Hours: 50, to2Hours: 200, to3Hours: 500, overhaul: 4000, to1CostRub: 5000, to2CostRub: 15000, to3CostRub: 40000, engineLifeHours: 6000 },
  },
  {
    id: "tuman-3",
    make: "Пегас-Агро", model: "Туман-3",
    country: "Россия", city: "Самара", category: "SPRAYER",
    productionYearStart: 2024, priceNewRub: 7_200_000,
    engine: { brand: "ГАЗ", model: "Evotech 2", horsePower: 150, kW: 110, cylinders: 4, displacementL: 3.0, fuelType: "gasoline", specificConsumptionGkWh: 270 },
    fuel: { tankCapacityL: 80, avgConsumptionLPerHour: 14, maxConsumptionLPerHour: 22, autonomyHours: 6 },
    dimensions: { weightKg: 4000, lengthMm: 5800, widthMm: 2300, heightMm: 2900 },
    performance: { workingWidthM: 36, productivityHaPerHour: 45, workingSpeedKmh: 25, transportSpeedKmh: 40 },
    fuelPerHa: { spraying: 0.4 },
    maintenance: { to1Hours: 50, to2Hours: 200, to3Hours: 500, overhaul: 5000, to1CostRub: 6000, to2CostRub: 18000, to3CostRub: 50000, engineLifeHours: 7000 },
  },
];

// ═══════════════════════════════════════════════
// ГРУЗОВИКИ
// ═══════════════════════════════════════════════

export const TRUCKS: EquipmentSpec[] = [
  {
    id: "kamaz-65115",
    make: "КАМАЗ", model: "КАМАЗ-65115",
    country: "Россия", city: "Набережные Челны", category: "TRUCK",
    productionYearStart: 1998, priceNewRub: 5_200_000,
    engine: { brand: "КАМАЗ", model: "740.62-280", horsePower: 280, kW: 206, cylinders: 8, displacementL: 11.76, fuelType: "diesel", specificConsumptionGkWh: 210 },
    fuel: { tankCapacityL: 350, avgConsumptionLPerHour: 20, maxConsumptionLPerHour: 32, autonomyHours: 17 },
    dimensions: { weightKg: 10200, lengthMm: 6690, widthMm: 2500, heightMm: 2995 },
    performance: { payloadKg: 15000, transportSpeedKmh: 90 },
    fuelPerHa: { transport: 30 }, // л/100км
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 8000, to1CostRub: 8000, to2CostRub: 25000, to3CostRub: 65000, engineLifeHours: 10000 },
  },
  {
    id: "kamaz-43118",
    make: "КАМАЗ", model: "КАМАЗ-43118 (6×6)",
    country: "Россия", city: "Набережные Челны", category: "TRUCK",
    productionYearStart: 2011, priceNewRub: 6_200_000,
    engine: { brand: "КАМАЗ", model: "740.662-300", horsePower: 300, kW: 221, cylinders: 8, displacementL: 11.76, fuelType: "diesel", specificConsumptionGkWh: 215 },
    fuel: { tankCapacityL: 500, avgConsumptionLPerHour: 25, maxConsumptionLPerHour: 38, autonomyHours: 20 },
    dimensions: { weightKg: 11200, lengthMm: 8530, widthMm: 2500, heightMm: 3000 },
    performance: { payloadKg: 12000, transportSpeedKmh: 85 },
    fuelPerHa: { transport: 35 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 8000, to1CostRub: 9000, to2CostRub: 28000, to3CostRub: 70000, engineLifeHours: 10000 },
  },
  {
    id: "ural-next",
    make: "Урал", model: "Урал NEXT",
    country: "Россия", city: "Миасс", category: "TRUCK",
    productionYearStart: 2018, priceNewRub: 5_500_000,
    engine: { brand: "ЯМЗ", model: "536.10", horsePower: 285, kW: 210, cylinders: 6, displacementL: 6.65, fuelType: "diesel", specificConsumptionGkWh: 220 },
    fuel: { tankCapacityL: 300, avgConsumptionLPerHour: 20, maxConsumptionLPerHour: 30, autonomyHours: 15 },
    dimensions: { weightKg: 9660, lengthMm: 7588, widthMm: 2500, heightMm: 2870 },
    performance: { payloadKg: 12000, transportSpeedKmh: 85 },
    fuelPerHa: { transport: 32 },
    maintenance: { to1Hours: 125, to2Hours: 500, to3Hours: 1000, overhaul: 8000, to1CostRub: 8000, to2CostRub: 25000, to3CostRub: 60000, engineLifeHours: 10000 },
  },
];

// ═══════════════════════════════════════════════
// НАВЕСНОЕ / ПРИЦЕПНОЕ ОБОРУДОВАНИЕ
// ═══════════════════════════════════════════════

export const IMPLEMENTS: EquipmentSpec[] = [
  {
    id: "sz-5-4",
    make: "Ростсельмаш", model: "СЗ-5,4",
    country: "Россия", city: "Ростов-на-Дону", category: "SEEDER",
    productionYearStart: 2018, priceNewRub: 1_200_000,
    engine: { brand: "-", model: "прицепная", horsePower: 0, kW: 0, cylinders: 0, displacementL: 0, fuelType: "diesel", specificConsumptionGkWh: 0 },
    fuel: { tankCapacityL: 0, avgConsumptionLPerHour: 0, maxConsumptionLPerHour: 0, autonomyHours: 0 },
    dimensions: { weightKg: 2400, lengthMm: 3800, widthMm: 5400, heightMm: 1800 },
    performance: { workingWidthM: 5.4, productivityHaPerHour: 4.3, workingSpeedKmh: 10 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 5000, to1CostRub: 3000, to2CostRub: 10000, to3CostRub: 25000, engineLifeHours: 0 },
  },
  {
    id: "kps-8",
    make: "БДМ-Агро", model: "КПС-8",
    country: "Россия", city: "Краснодар", category: "CULTIVATOR",
    productionYearStart: 2020, priceNewRub: 850_000,
    engine: { brand: "-", model: "прицепной", horsePower: 0, kW: 0, cylinders: 0, displacementL: 0, fuelType: "diesel", specificConsumptionGkWh: 0 },
    fuel: { tankCapacityL: 0, avgConsumptionLPerHour: 0, maxConsumptionLPerHour: 0, autonomyHours: 0 },
    dimensions: { weightKg: 1800, lengthMm: 3200, widthMm: 8000, heightMm: 1500 },
    performance: { workingWidthM: 8, productivityHaPerHour: 6.4, workingSpeedKmh: 10 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 5000, to1CostRub: 2000, to2CostRub: 8000, to3CostRub: 20000, engineLifeHours: 0 },
  },
  {
    id: "pln-5-35",
    make: "Рубцовск", model: "ПЛН-5-35",
    country: "Россия", city: "Рубцовск", category: "PLOW",
    productionYearStart: 2000, priceNewRub: 320_000,
    engine: { brand: "-", model: "навесной", horsePower: 0, kW: 0, cylinders: 0, displacementL: 0, fuelType: "diesel", specificConsumptionGkWh: 0 },
    fuel: { tankCapacityL: 0, avgConsumptionLPerHour: 0, maxConsumptionLPerHour: 0, autonomyHours: 0 },
    dimensions: { weightKg: 710, lengthMm: 3150, widthMm: 1750, heightMm: 1350 },
    performance: { workingWidthM: 1.75, productivityHaPerHour: 1.1, workingSpeedKmh: 8 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 5000, to1CostRub: 1500, to2CostRub: 5000, to3CostRub: 15000, engineLifeHours: 0 },
  },
  {
    id: "bdt-7",
    make: "БДМ-Агро", model: "БДТ-7",
    country: "Россия", city: "Краснодар", category: "HARROW",
    productionYearStart: 2018, priceNewRub: 680_000,
    engine: { brand: "-", model: "прицепная", horsePower: 0, kW: 0, cylinders: 0, displacementL: 0, fuelType: "diesel", specificConsumptionGkWh: 0 },
    fuel: { tankCapacityL: 0, avgConsumptionLPerHour: 0, maxConsumptionLPerHour: 0, autonomyHours: 0 },
    dimensions: { weightKg: 3200, lengthMm: 3600, widthMm: 7000, heightMm: 1600 },
    performance: { workingWidthM: 7, productivityHaPerHour: 5.6, workingSpeedKmh: 10 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 5000, to1CostRub: 2000, to2CostRub: 8000, to3CostRub: 20000, engineLifeHours: 0 },
  },
  {
    id: "rum-8",
    make: "Бобруйскагромаш", model: "РУМ-8",
    country: "Беларусь", city: "Бобруйск", category: "FERTILIZER_SPREADER",
    productionYearStart: 2015, priceNewRub: 950_000,
    engine: { brand: "-", model: "прицепной", horsePower: 0, kW: 0, cylinders: 0, displacementL: 0, fuelType: "diesel", specificConsumptionGkWh: 0 },
    fuel: { tankCapacityL: 0, avgConsumptionLPerHour: 0, maxConsumptionLPerHour: 0, autonomyHours: 0 },
    dimensions: { weightKg: 4500, lengthMm: 5600, widthMm: 2500, heightMm: 2400 },
    performance: { workingWidthM: 24, productivityHaPerHour: 12, payloadKg: 8000, workingSpeedKmh: 12 },
    maintenance: { to1Hours: 60, to2Hours: 240, to3Hours: 960, overhaul: 5000, to1CostRub: 2000, to2CostRub: 7000, to3CostRub: 18000, engineLifeHours: 0 },
  },
];

// ═══════════════════════════════════════════════
// НОРМЫ РАСХОДА ГСМ ПО ВИДАМ РАБОТ (л/га)
// По данным Минсельхоза РФ
// ═══════════════════════════════════════════════

export const FUEL_NORMS_PER_HA = {
  plowing:     { min: 14, avg: 18, max: 25, label: "Вспашка" },
  cultivation: { min: 6,  avg: 9,  max: 12, label: "Культивация" },
  disking:     { min: 5,  avg: 7,  max: 10, label: "Дискование" },
  harrowing:   { min: 3,  avg: 5,  max: 7,  label: "Боронование" },
  seeding:     { min: 5,  avg: 8,  max: 12, label: "Посев" },
  spraying:    { min: 0.3,avg: 0.6,max: 1.2,label: "Опрыскивание" },
  fertilizing: { min: 3,  avg: 5,  max: 8,  label: "Внесение удобрений" },
  harvesting:  { min: 5,  avg: 7,  max: 10, label: "Уборка" },
} as const;

// ═══════════════════════════════════════════════
// НОРМЫ ВЫРАБОТКИ (га/смена, 7 ч)
// ═══════════════════════════════════════════════

export const PRODUCTIVITY_NORMS = {
  plowing:     { label: "Вспашка",     perShift7h: { class14: 5, class2: 9, class3: 14, class5: 25 } },
  cultivation: { label: "Культивация", perShift7h: { class14: 15, class2: 25, class3: 40, class5: 60 } },
  seeding:     { label: "Посев",       perShift7h: { class14: 12, class2: 22, class3: 35, class5: 50 } },
  spraying:    { label: "Опрыскивание",perShift7h: { tuman: 300 } },
  harvesting:  { label: "Уборка",      perShift7h: { nova: 18, acros: 32, torum: 56 } },
} as const;

// ═══════════════════════════════════════════════
// ПОИСК ПО КАТАЛОГУ
// ═══════════════════════════════════════════════

export const FULL_CATALOG: EquipmentSpec[] = [
  ...TRACTORS,
  ...GRAIN_COMBINES,
  ...SPRAYERS,
  ...TRUCKS,
  ...IMPLEMENTS,
];

/** Найти модель по make + model */
export function findSpec(make: string, model: string): EquipmentSpec | undefined {
  return FULL_CATALOG.find(
    (s) => s.make === make && s.model === model
  );
}

/** Найти модель по ID */
export function findSpecById(id: string): EquipmentSpec | undefined {
  return FULL_CATALOG.find((s) => s.id === id);
}

/** Все модели по категории */
export function findByCategory(category: string): EquipmentSpec[] {
  return FULL_CATALOG.filter((s) => s.category === category);
}

/** Расчёт: на сколько часов хватит бака */
export function calcAutonomy(spec: EquipmentSpec): number {
  if (spec.fuel.avgConsumptionLPerHour <= 0) return 0;
  return Math.round(spec.fuel.tankCapacityL / spec.fuel.avgConsumptionLPerHour * 10) / 10;
}

/** Расчёт: сколько топлива нужно на площадь для работы */
export function calcFuelForArea(spec: EquipmentSpec, areaHa: number, workType: keyof typeof FUEL_NORMS_PER_HA): number {
  const perHa = spec.fuelPerHa?.[workType as keyof NonNullable<EquipmentSpec["fuelPerHa"]>];
  if (perHa) return Math.round(areaHa * perHa);
  const norm = FUEL_NORMS_PER_HA[workType];
  return Math.round(areaHa * norm.avg);
}

/** Расчёт: сколько времени займёт работа */
export function calcWorkTime(spec: EquipmentSpec, areaHa: number): { hours: number; shifts: number } {
  const prodHa = spec.performance.productivityHaPerHour;
  if (!prodHa || prodHa <= 0) return { hours: 0, shifts: 0 };
  const hours = Math.round(areaHa / prodHa * 10) / 10;
  return { hours, shifts: Math.ceil(hours / 7) };
}

/** Расчёт: сколько заправок нужно на площадь */
export function calcRefills(spec: EquipmentSpec, areaHa: number, workType: keyof typeof FUEL_NORMS_PER_HA): number {
  const totalFuel = calcFuelForArea(spec, areaHa, workType);
  if (spec.fuel.tankCapacityL <= 0) return 0;
  return Math.ceil(totalFuel / spec.fuel.tankCapacityL);
}

/** Расчёт: когда следующее ТО */
export function calcNextMaintenance(spec: EquipmentSpec, currentHours: number): { type: string; atHours: number; remainingHours: number } {
  const { to1Hours, to2Hours, to3Hours } = spec.maintenance;
  const nextTo1 = Math.ceil(currentHours / to1Hours) * to1Hours;
  const nextTo2 = Math.ceil(currentHours / to2Hours) * to2Hours;
  const nextTo3 = Math.ceil(currentHours / to3Hours) * to3Hours;

  const options = [
    { type: "ТО-1", atHours: nextTo1, remainingHours: nextTo1 - currentHours, cost: spec.maintenance.to1CostRub },
    { type: "ТО-2", atHours: nextTo2, remainingHours: nextTo2 - currentHours, cost: spec.maintenance.to2CostRub },
    { type: "ТО-3", atHours: nextTo3, remainingHours: nextTo3 - currentHours, cost: spec.maintenance.to3CostRub },
  ].filter((o) => o.remainingHours > 0);

  options.sort((a, b) => a.remainingHours - b.remainingHours);
  return options[0] || { type: "ТО-1", atHours: to1Hours, remainingHours: to1Hours };
}
