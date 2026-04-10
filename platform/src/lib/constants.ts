export const APP_NAME = "AZAT Platform";

// ═══════════════════════════════════════════════
// КАТЕГОРИИ ТЕХНИКИ (российский рынок)
// ═══════════════════════════════════════════════

export const EQUIPMENT_CATEGORIES = {
  TRACTOR: { label: "Трактор", icon: "tractor" },
  GRAIN_COMBINE: { label: "Комбайн зерноуборочный", icon: "combine" },
  FORAGE_COMBINE: { label: "Комбайн кормоуборочный", icon: "forage" },
  SPRAYER: { label: "Опрыскиватель", icon: "sprayer" },
  SEEDER: { label: "Сеялка", icon: "seeder" },
  CULTIVATOR: { label: "Культиватор", icon: "cultivator" },
  PLOW: { label: "Плуг", icon: "plow" },
  HARROW: { label: "Борона", icon: "harrow" },
  TRUCK: { label: "Грузовик", icon: "truck" },
  TRAILER: { label: "Прицеп", icon: "trailer" },
  GRAIN_DRYER: { label: "Зерносушилка", icon: "dryer" },
  FERTILIZER_SPREADER: { label: "Разбрасыватель удобрений", icon: "spreader" },
  LOADER: { label: "Погрузчик", icon: "loader" },
  BULLDOZER: { label: "Бульдозер", icon: "bulldozer" },
  DRONE: { label: "Дрон", icon: "drone" },
  OTHER: { label: "Другое", icon: "other" },
} as const;

export const EQUIPMENT_STATUSES = {
  ACTIVE: { label: "Активна", color: "#22c55e" },
  IDLE: { label: "Простой", color: "#eab308" },
  MAINTENANCE: { label: "Обслуживание", color: "#f97316" },
  DECOMMISSIONED: { label: "Списана", color: "#6b7280" },
} as const;

// ═══════════════════════════════════════════════
// ПРОИЗВОДИТЕЛИ ТЕХНИКИ (Россия, Беларусь, Китай)
// ═══════════════════════════════════════════════

export const EQUIPMENT_MANUFACTURERS = {
  // Российские
  ROSTSELMASH: {
    name: "Ростсельмаш",
    country: "Россия",
    city: "Ростов-на-Дону",
    types: ["GRAIN_COMBINE", "FORAGE_COMBINE", "TRACTOR", "SEEDER"],
    models: {
      GRAIN_COMBINE: [
        { model: "ACROS 550", hp: 280, year: 2018, priceRub: 8_500_000 },
        { model: "ACROS 585", hp: 300, year: 2020, priceRub: 10_200_000 },
        { model: "ACROS 595 Plus", hp: 327, year: 2022, priceRub: 12_000_000 },
        { model: "TORUM 750", hp: 425, year: 2020, priceRub: 18_500_000 },
        { model: "TORUM 785", hp: 510, year: 2023, priceRub: 24_000_000 },
        { model: "NOVA 340", hp: 210, year: 2018, priceRub: 6_200_000 },
        { model: "NOVA S300", hp: 185, year: 2021, priceRub: 5_800_000 },
        { model: "VECTOR 410", hp: 210, year: 2019, priceRub: 5_500_000 },
      ],
      TRACTOR: [
        { model: "RSM 2375", hp: 380, year: 2022, priceRub: 16_000_000 },
        { model: "RSM 3535", hp: 350, year: 2023, priceRub: 14_500_000 },
        { model: "RSM 3575", hp: 380, year: 2024, priceRub: 17_000_000 },
      ],
    },
  },
  PTZ: {
    name: "ПТЗ (Петербургский тракторный завод)",
    country: "Россия",
    city: "Санкт-Петербург",
    types: ["TRACTOR"],
    models: {
      TRACTOR: [
        { model: "Кировец К-7М", hp: 300, year: 2020, priceRub: 10_500_000 },
        { model: "Кировец К-7М 420", hp: 420, year: 2023, priceRub: 14_200_000 },
        { model: "Кировец К-525 Premium", hp: 525, year: 2023, priceRub: 6_020_000 },
        { model: "Кировец К-424", hp: 240, year: 2022, priceRub: 8_500_000 },
      ],
    },
  },
  BTZ: {
    name: "БТЗ (Брянский тракторный завод)",
    country: "Россия",
    city: "Брянск",
    types: ["TRACTOR"],
    models: {
      TRACTOR: [
        { model: "БТЗ-243К", hp: 240, year: 2022, priceRub: 7_800_000 },
        { model: "БТЗ-244К", hp: 300, year: 2023, priceRub: 9_200_000 },
        { model: "БТЗ-246К", hp: 350, year: 2024, priceRub: 11_500_000 },
        { model: "БТЗ-150", hp: 150, year: 2021, priceRub: 4_500_000 },
        { model: "БТЗ-181 (гусеничный)", hp: 180, year: 2022, priceRub: 5_800_000 },
      ],
    },
  },
  AGROMASH: {
    name: "АГРОМАШ",
    country: "Россия",
    city: "Чебоксары",
    types: ["TRACTOR"],
    models: {
      TRACTOR: [
        { model: "Агромаш-180ТК", hp: 180, year: 2023, priceRub: 6_200_000 },
        { model: "Агромаш-315ТГ", hp: 315, year: 2024, priceRub: 10_800_000 },
        { model: "Агромаш-90ТГ", hp: 90, year: 2022, priceRub: 3_500_000 },
      ],
    },
  },
  TERRION: {
    name: "Террион (Агротехмаш)",
    country: "Россия",
    city: "Тамбов",
    types: ["TRACTOR"],
    models: {
      TRACTOR: [
        { model: "Terrion ATM 3180", hp: 180, year: 2021, priceRub: 7_000_000 },
        { model: "Terrion ATM 5280", hp: 280, year: 2022, priceRub: 11_000_000 },
        { model: "Terrion ATM 7360", hp: 360, year: 2023, priceRub: 15_000_000 },
      ],
    },
  },
  PEGAS_AGRO: {
    name: "Пегас-Агро",
    country: "Россия",
    city: "Самара",
    types: ["SPRAYER"],
    models: {
      SPRAYER: [
        { model: "Туман-1М", hp: 0, year: 2020, priceRub: 4_500_000 },
        { model: "Туман-2", hp: 0, year: 2022, priceRub: 5_800_000 },
        { model: "Туман-3", hp: 0, year: 2024, priceRub: 7_200_000 },
      ],
    },
  },
  KLEVER: {
    name: "Клевер",
    country: "Россия",
    city: "Ростов-на-Дону",
    types: ["FORAGE_COMBINE", "SEEDER", "CULTIVATOR"],
    models: {
      FORAGE_COMBINE: [
        { model: "Клевер КДП-3000", hp: 250, year: 2022, priceRub: 8_500_000 },
      ],
    },
  },
  KAMAZ: {
    name: "КАМАЗ",
    country: "Россия",
    city: "Набережные Челны",
    types: ["TRUCK"],
    models: {
      TRUCK: [
        { model: "КАМАЗ-65115", hp: 280, year: 2023, priceRub: 5_200_000 },
        { model: "КАМАЗ-65117", hp: 300, year: 2024, priceRub: 6_500_000 },
        { model: "КАМАЗ-45143 (самосвал)", hp: 260, year: 2023, priceRub: 5_800_000 },
        { model: "КАМАЗ-43118", hp: 300, year: 2024, priceRub: 6_200_000 },
      ],
    },
  },
  GAZ: {
    name: "ГАЗ",
    country: "Россия",
    city: "Нижний Новгород",
    types: ["TRUCK"],
    models: {
      TRUCK: [
        { model: "ГАЗон NEXT", hp: 150, year: 2023, priceRub: 3_200_000 },
        { model: "Садко NEXT 4x4", hp: 150, year: 2024, priceRub: 3_800_000 },
      ],
    },
  },
  URAL: {
    name: "Урал",
    country: "Россия",
    city: "Миасс",
    types: ["TRUCK"],
    models: {
      TRUCK: [
        { model: "Урал NEXT", hp: 285, year: 2023, priceRub: 5_500_000 },
        { model: "Урал-4320", hp: 240, year: 2022, priceRub: 4_800_000 },
      ],
    },
  },
  // Белорусские
  MTZ: {
    name: "МТЗ (Минский тракторный завод)",
    country: "Беларусь",
    city: "Минск",
    types: ["TRACTOR"],
    models: {
      TRACTOR: [
        { model: "БЕЛАРУС-82.1", hp: 81, year: 2024, priceRub: 2_680_000 },
        { model: "БЕЛАРУС-920", hp: 89, year: 2023, priceRub: 3_100_000 },
        { model: "БЕЛАРУС-1025", hp: 105, year: 2023, priceRub: 3_600_000 },
        { model: "БЕЛАРУС-1221.2", hp: 136, year: 2024, priceRub: 4_800_000 },
        { model: "БЕЛАРУС-1523", hp: 155, year: 2023, priceRub: 5_500_000 },
        { model: "БЕЛАРУС-2022.3", hp: 212, year: 2024, priceRub: 7_200_000 },
        { model: "БЕЛАРУС-3022", hp: 303, year: 2024, priceRub: 10_500_000 },
        { model: "БЕЛАРУС-3522", hp: 355, year: 2025, priceRub: 13_000_000 },
      ],
    },
  },
  GOMSELMASH: {
    name: "Гомсельмаш",
    country: "Беларусь",
    city: "Гомель",
    types: ["GRAIN_COMBINE", "FORAGE_COMBINE"],
    models: {
      GRAIN_COMBINE: [
        { model: "Палессе GS12A1", hp: 330, year: 2022, priceRub: 14_000_000 },
        { model: "Палессе GS4118К (газ)", hp: 350, year: 2024, priceRub: 16_500_000 },
        { model: "Палессе GS575", hp: 230, year: 2023, priceRub: 9_800_000 },
      ],
      FORAGE_COMBINE: [
        { model: "Палессе FS80", hp: 450, year: 2023, priceRub: 18_000_000 },
        { model: "Палессе FS60", hp: 350, year: 2022, priceRub: 14_500_000 },
      ],
    },
  },
  // Китайские (растущая доля — 95% импорта)
  LOVOL: {
    name: "Lovol (Weichai Lovol)",
    country: "Китай",
    city: "Вэйфан",
    types: ["TRACTOR"],
    models: {
      TRACTOR: [
        { model: "Lovol TD1004", hp: 100, year: 2024, priceRub: 2_800_000 },
        { model: "Lovol TF1504", hp: 150, year: 2024, priceRub: 4_200_000 },
        { model: "Lovol TG2054", hp: 205, year: 2025, priceRub: 5_800_000 },
        { model: "Lovol TG2654", hp: 265, year: 2025, priceRub: 7_500_000 },
      ],
    },
  },
  YTO: {
    name: "YTO",
    country: "Китай",
    city: "Лоян",
    types: ["TRACTOR"],
    models: {
      TRACTOR: [
        { model: "YTO ELX1054", hp: 105, year: 2024, priceRub: 2_500_000 },
        { model: "YTO ELG1604", hp: 160, year: 2024, priceRub: 4_000_000 },
        { model: "YTO ELX2204", hp: 220, year: 2025, priceRub: 5_500_000 },
      ],
    },
  },
  ZOOMLION: {
    name: "Zoomlion Agriculture",
    country: "Китай",
    city: "Чанша",
    types: ["TRACTOR", "GRAIN_COMBINE"],
    models: {
      TRACTOR: [
        { model: "Zoomlion RH1104", hp: 110, year: 2024, priceRub: 3_000_000 },
        { model: "Zoomlion RN2004", hp: 200, year: 2025, priceRub: 5_200_000 },
      ],
    },
  },
} as const;

// ═══════════════════════════════════════════════
// РЫНОЧНАЯ СТАТИСТИКА (для аналитики и ценообразования)
// ═══════════════════════════════════════════════

export const MARKET_STATS = {
  // Продажи по годам (тыс. шт.)
  salesByYear: {
    2020: { tractors: 14_200, combines: 5_800, sprayers: 1_200, seeders: 2_400 },
    2021: { tractors: 16_100, combines: 6_200, sprayers: 1_400, seeders: 2_800 },
    2022: { tractors: 13_500, combines: 5_100, sprayers: 1_100, seeders: 2_100 },
    2023: { tractors: 12_800, combines: 4_900, sprayers: 980, seeders: 1_900 },
    2024: { tractors: 9_600, combines: 3_700, sprayers: 760, seeders: 1_500 },
    2025: { tractors: 8_500, combines: 3_400, sprayers: 700, seeders: 1_400 },
  },
  // Доли рынка по происхождению (2024-2025)
  marketShare: {
    russia: 55, // %
    belarus: 25,
    china: 15,
    other: 5,
  },
  // Дефицит техники
  shortage: {
    tractors: 62_000,
    combines: 34_000,
    renewalRate: 3.5, // % в год (норма 10%)
    fleetWear: 50, // % износа
  },
  // Средние цены аренды (₽/день)
  rentalPrices: {
    TRACTOR: { min: 8_000, avg: 15_000, max: 35_000 },
    GRAIN_COMBINE: { min: 25_000, avg: 45_000, max: 80_000 },
    FORAGE_COMBINE: { min: 20_000, avg: 35_000, max: 60_000 },
    SPRAYER: { min: 10_000, avg: 18_000, max: 30_000 },
    SEEDER: { min: 5_000, avg: 12_000, max: 25_000 },
    TRUCK: { min: 5_000, avg: 10_000, max: 20_000 },
  },
} as const;

// ═══════════════════════════════════════════════
// ТИПЫ ТОПЛИВА
// ═══════════════════════════════════════════════

export const FUEL_TYPES = {
  diesel: { label: "Дизель (ДТ)", unit: "л" },
  gasoline: { label: "Бензин (АИ-92/95)", unit: "л" },
  gas: { label: "Газ (метан/СУГ)", unit: "м³" },
  electric: { label: "Электро", unit: "кВт·ч" },
} as const;

// ═══════════════════════════════════════════════
// РОССИЙСКИЕ КУЛЬТУРЫ
// ═══════════════════════════════════════════════

export const CROPS_RU = {
  wheat_winter: { name: "Пшеница озимая", avgYieldKgHa: 4_000 },
  wheat_spring: { name: "Пшеница яровая", avgYieldKgHa: 2_500 },
  barley_spring: { name: "Ячмень яровой", avgYieldKgHa: 2_800 },
  barley_winter: { name: "Ячмень озимый", avgYieldKgHa: 3_500 },
  corn: { name: "Кукуруза", avgYieldKgHa: 5_500 },
  sunflower: { name: "Подсолнечник", avgYieldKgHa: 1_800 },
  soybean: { name: "Соя", avgYieldKgHa: 1_600 },
  rapeseed: { name: "Рапс", avgYieldKgHa: 2_000 },
  sugar_beet: { name: "Сахарная свёкла", avgYieldKgHa: 45_000 },
  potato: { name: "Картофель", avgYieldKgHa: 25_000 },
  oats: { name: "Овёс", avgYieldKgHa: 2_200 },
  rye: { name: "Рожь", avgYieldKgHa: 2_000 },
  buckwheat: { name: "Гречиха", avgYieldKgHa: 1_000 },
  flax: { name: "Лён", avgYieldKgHa: 800 },
  millet: { name: "Просо", avgYieldKgHa: 1_200 },
  peas: { name: "Горох", avgYieldKgHa: 2_000 },
  corn_silage: { name: "Кукуруза на силос", avgYieldKgHa: 35_000 },
  alfalfa: { name: "Люцерна", avgYieldKgHa: 8_000 },
  clover: { name: "Клевер", avgYieldKgHa: 6_000 },
} as const;

// ═══════════════════════════════════════════════
// РАБОТЫ И ДАТЧИКИ
// ═══════════════════════════════════════════════

export const ACTIVITY_TYPES = {
  PLOWING: { label: "Вспашка", color: "#8B4513" },
  CULTIVATION: { label: "Культивация", color: "#D2691E" },
  SEEDING: { label: "Посев", color: "#228B22" },
  FERTILIZING: { label: "Внесение удобрений", color: "#FFD700" },
  SPRAYING: { label: "Опрыскивание", color: "#4169E1" },
  IRRIGATION: { label: "Полив", color: "#00CED1" },
  HARVESTING: { label: "Уборка урожая", color: "#DAA520" },
  TRANSPORT: { label: "Транспортировка", color: "#708090" },
  SCOUTING: { label: "Обследование", color: "#9370DB" },
  SOIL_SAMPLING: { label: "Отбор проб почвы", color: "#A0522D" },
  MAINTENANCE_TASK: { label: "Обслуживание", color: "#FF6347" },
  OTHER: { label: "Другое", color: "#808080" },
} as const;

export const ACTIVITY_STATUSES = {
  PLANNED: { label: "Запланировано", color: "#3b82f6" },
  IN_PROGRESS: { label: "В работе", color: "#f59e0b" },
  COMPLETED: { label: "Завершено", color: "#22c55e" },
  CANCELLED: { label: "Отменено", color: "#ef4444" },
  OVERDUE: { label: "Просрочено", color: "#dc2626" },
} as const;

export const SENSOR_TYPES = {
  SOIL_MOISTURE: { label: "Влажность почвы", unit: "%" },
  SOIL_TEMPERATURE: { label: "Температура почвы", unit: "°C" },
  AIR_TEMPERATURE: { label: "Температура воздуха", unit: "°C" },
  AIR_HUMIDITY: { label: "Влажность воздуха", unit: "%" },
  RAINFALL: { label: "Осадки", unit: "мм" },
  WIND_SPEED: { label: "Скорость ветра", unit: "м/с" },
  FERTILIZER_DEPTH: { label: "Глубина удобрения", unit: "см" },
  PH_METER: { label: "pH почвы", unit: "pH" },
  LIGHT: { label: "Освещенность", unit: "лк" },
  LEAF_WETNESS: { label: "Влажность листа", unit: "%" },
  OTHER: { label: "Другое", unit: "" },
} as const;

export const DEFAULT_MAP_CENTER = { lat: 52.0, lon: 47.0 }; // Центральное Черноземье
export const DEFAULT_MAP_ZOOM = 5;

// Российские регионы для маркетплейса
export const REGIONS_RU = [
  "Краснодарский край",
  "Ростовская область",
  "Ставропольский край",
  "Воронежская область",
  "Курская область",
  "Белгородская область",
  "Тамбовская область",
  "Саратовская область",
  "Волгоградская область",
  "Оренбургская область",
  "Самарская область",
  "Татарстан",
  "Башкортостан",
  "Алтайский край",
  "Новосибирская область",
  "Омская область",
  "Челябинская область",
  "Тульская область",
  "Липецкая область",
  "Пензенская область",
  "Московская область",
] as const;
