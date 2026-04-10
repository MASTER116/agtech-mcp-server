/**
 * БАЗА ДАННЫХ ТО И ПОЛОМОК СЕЛЬХОЗТЕХНИКИ
 *
 * Содержит:
 * - Регламент ТО по моточасам для каждой модели
 * - Типичные поломки с вероятностью по моточасам
 * - Стоимость ремонта и запчастей
 * - Признаки приближающейся поломки
 */

// ═══════════════════════════════════════════════
// Типы
// ═══════════════════════════════════════════════

export interface MaintenanceTask {
  /** Название работы */
  name: string;
  /** Описание */
  description: string;
  /** Категория */
  category: "engine" | "transmission" | "hydraulics" | "electrical" | "chassis" | "body" | "cooling" | "fuel" | "harvesting_unit" | "spraying_unit";
  /** Необходимые материалы */
  materials: { name: string; quantity: string; costRub: number }[];
  /** Время работы, ч */
  laborHours: number;
}

export interface MaintenanceSchedule {
  /** Интервал ТО, моточасов */
  intervalHours: number;
  /** Тип ТО */
  type: "ЕТО" | "ТО-1" | "ТО-2" | "ТО-3" | "СТО";
  /** Список работ */
  tasks: MaintenanceTask[];
  /** Общая стоимость материалов, ₽ */
  materialsCostRub: number;
  /** Стоимость работ, ₽ */
  laborCostRub: number;
}

export interface CommonFailure {
  /** ID поломки */
  id: string;
  /** Название */
  name: string;
  /** Описание */
  description: string;
  /** Узел/система */
  system: string;
  /** Симптомы (для диагностики) */
  symptoms: string[];
  /** Причины */
  causes: string[];
  /** Вероятность возникновения при моточасах (диапазон) */
  probabilityByHours: { from: number; to: number; probability: number }[];
  /** Базовая вероятность отказа за 1000 моточасов, % */
  baseProbabilityPer1000h: number;
  /** Стоимость ремонта, ₽ */
  repairCostRub: { min: number; avg: number; max: number };
  /** Время простоя, дней */
  downtimeDays: { min: number; avg: number; max: number };
  /** Критичность */
  severity: "low" | "medium" | "high" | "critical";
  /** Можно ли устранить в поле */
  fieldRepairable: boolean;
  /** Сезонность (когда чаще ломается) */
  seasonality?: ("spring" | "summer" | "autumn" | "winter")[];
}

export interface ModelMaintenanceProfile {
  /** ID модели (из equipment-catalog) */
  modelId: string;
  /** Регламент ТО */
  schedule: MaintenanceSchedule[];
  /** Типичные поломки */
  commonFailures: CommonFailure[];
}

// ═══════════════════════════════════════════════
// РЕГЛАМЕНТ ТО + ПОЛОМКИ: МТЗ-82.1
// ═══════════════════════════════════════════════

export const MTZ_82_PROFILE: ModelMaintenanceProfile = {
  modelId: "mtz-82-1",
  schedule: [
    {
      intervalHours: 10, type: "ЕТО",
      tasks: [
        { name: "Проверка уровня масла двигателя", description: "Щуп, доливка при необходимости", category: "engine", materials: [], laborHours: 0.2 },
        { name: "Проверка уровня ОЖ", description: "Расширительный бачок", category: "cooling", materials: [], laborHours: 0.1 },
        { name: "Проверка натяжения ремней", description: "Ремень генератора, вентилятора", category: "engine", materials: [], laborHours: 0.1 },
        { name: "Слив конденсата из воздушных баллонов", description: "", category: "chassis", materials: [], laborHours: 0.1 },
      ],
      materialsCostRub: 0, laborCostRub: 500,
    },
    {
      intervalHours: 60, type: "ТО-1",
      tasks: [
        { name: "Замена масла двигателя", description: "М-10Г2к или аналог, 12 л", category: "engine", materials: [{ name: "Масло М-10Г2к 10л", quantity: "12 л", costRub: 2800 }], laborHours: 0.5 },
        { name: "Замена масляного фильтра", description: "", category: "engine", materials: [{ name: "Фильтр масляный", quantity: "1 шт", costRub: 350 }], laborHours: 0.3 },
        { name: "Замена топливного фильтра", description: "Фильтр грубой и тонкой очистки", category: "fuel", materials: [{ name: "Фильтр топливный", quantity: "2 шт", costRub: 600 }], laborHours: 0.4 },
        { name: "Смазка шарниров рулевого управления", description: "Литол-24", category: "chassis", materials: [{ name: "Литол-24", quantity: "0.5 кг", costRub: 200 }], laborHours: 0.5 },
        { name: "Проверка и регулировка сцепления", description: "Свободный ход педали 40 мм", category: "transmission", materials: [], laborHours: 0.5 },
      ],
      materialsCostRub: 3950, laborCostRub: 3000,
    },
    {
      intervalHours: 240, type: "ТО-2",
      tasks: [
        { name: "Все работы ТО-1", description: "", category: "engine", materials: [], laborHours: 0 },
        { name: "Замена масла трансмиссии (КПП)", description: "ТАД-17и, 40 л", category: "transmission", materials: [{ name: "Масло ТАД-17и", quantity: "40 л", costRub: 6000 }], laborHours: 1 },
        { name: "Замена масла заднего моста", description: "", category: "transmission", materials: [{ name: "Масло ТАД-17и", quantity: "20 л", costRub: 3000 }], laborHours: 0.5 },
        { name: "Замена масла ПВМ", description: "Передний ведущий мост", category: "transmission", materials: [{ name: "Масло", quantity: "10 л", costRub: 1500 }], laborHours: 0.5 },
        { name: "Замена воздушного фильтра", description: "", category: "engine", materials: [{ name: "Фильтр воздушный", quantity: "1 шт", costRub: 800 }], laborHours: 0.3 },
        { name: "Регулировка клапанов", description: "Зазор впускных 0.25мм, выпускных 0.30мм", category: "engine", materials: [], laborHours: 1.5 },
        { name: "Проверка форсунок", description: "Давление впрыска 17.5 МПа", category: "fuel", materials: [], laborHours: 1 },
      ],
      materialsCostRub: 15250, laborCostRub: 8000,
    },
    {
      intervalHours: 960, type: "ТО-3",
      tasks: [
        { name: "Все работы ТО-2", description: "", category: "engine", materials: [], laborHours: 0 },
        { name: "Замена ОЖ", description: "Тосол/антифриз 20 л", category: "cooling", materials: [{ name: "Антифриз", quantity: "20 л", costRub: 3000 }], laborHours: 0.5 },
        { name: "Проверка и регулировка ТНВД", description: "Топливный насос высокого давления", category: "fuel", materials: [], laborHours: 3 },
        { name: "Проверка генератора и стартера", description: "Щётки, подшипники", category: "electrical", materials: [{ name: "Щётки генератора", quantity: "1 комплект", costRub: 500 }], laborHours: 1.5 },
        { name: "Замена подшипников ступиц", description: "При износе", category: "chassis", materials: [{ name: "Подшипник ступицы", quantity: "2 шт", costRub: 2000 }], laborHours: 3 },
        { name: "Проверка гидросистемы", description: "Давление, герметичность, шланги", category: "hydraulics", materials: [{ name: "Масло гидросистемы", quantity: "20 л", costRub: 4000 }], laborHours: 2 },
      ],
      materialsCostRub: 25000, laborCostRub: 20000,
    },
  ],
  commonFailures: [
    {
      id: "mtz82-clutch-wear", name: "Износ сцепления",
      description: "Пробуксовка, неполное выключение сцепления. Самая частая проблема МТЗ-82.",
      system: "Трансмиссия", symptoms: ["Пробуксовка при нагрузке", "Трудности переключения передач", "Запах горелого", "Вибрация при трогании"],
      causes: ["Неправильная регулировка свободного хода педали", "Перегрузка трактора", "Работа на повышенных передачах с тяжёлыми орудиями"],
      probabilityByHours: [{ from: 0, to: 2000, probability: 5 }, { from: 2000, to: 4000, probability: 15 }, { from: 4000, to: 6000, probability: 35 }, { from: 6000, to: 8000, probability: 60 }],
      baseProbabilityPer1000h: 8, repairCostRub: { min: 25000, avg: 45000, max: 65000 }, downtimeDays: { min: 1, avg: 2, max: 4 },
      severity: "high", fieldRepairable: false, seasonality: ["spring", "autumn"],
    },
    {
      id: "mtz82-hydraulic-pump", name: "Износ насоса гидравлики НШ-32",
      description: "Течь масла через сальник в КПП, снижение давления гидросистемы.",
      system: "Гидравлика", symptoms: ["Медленный подъём навески", "Течь масла", "Уровень масла в КПП растёт", "Шум при работе гидросистемы"],
      causes: ["Загрязнённое масло", "Естественный износ", "Работа на холодном масле"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 5 }, { from: 3000, to: 5000, probability: 20 }, { from: 5000, to: 7000, probability: 40 }],
      baseProbabilityPer1000h: 6, repairCostRub: { min: 8000, avg: 15000, max: 25000 }, downtimeDays: { min: 0.5, avg: 1, max: 2 },
      severity: "medium", fieldRepairable: true,
    },
    {
      id: "mtz82-rear-axle-bearings", name: "Износ подшипников заднего моста",
      description: "Гул и вибрация от заднего моста, особенно при работе с навеской.",
      system: "Ходовая", symptoms: ["Гул при движении", "Вибрация при нагрузке", "Нагрев ступиц"],
      causes: ["Работа с тяжёлым навесным оборудованием", "Несвоевременная замена масла заднего моста", "Работа на спарке"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 3 }, { from: 3000, to: 5000, probability: 12 }, { from: 5000, to: 7000, probability: 25 }],
      baseProbabilityPer1000h: 4, repairCostRub: { min: 10000, avg: 20000, max: 35000 }, downtimeDays: { min: 1, avg: 2, max: 3 },
      severity: "medium", fieldRepairable: false,
    },
    {
      id: "mtz82-starter", name: "Отказ стартера",
      description: "Родной стартер — слабое место. Не заводит или щёлкает.",
      system: "Электрика", symptoms: ["Трактор не заводится", "Щёлканье при повороте ключа", "Медленное вращение"],
      causes: ["Износ щёток и коллектора", "Окисление контактов", "Холодный запуск зимой"],
      probabilityByHours: [{ from: 0, to: 2000, probability: 10 }, { from: 2000, to: 4000, probability: 20 }, { from: 4000, to: 6000, probability: 35 }],
      baseProbabilityPer1000h: 7, repairCostRub: { min: 3000, avg: 8000, max: 15000 }, downtimeDays: { min: 0.2, avg: 0.5, max: 1 },
      severity: "medium", fieldRepairable: true, seasonality: ["winter", "spring"],
    },
    {
      id: "mtz82-head-gasket", name: "Прокладка ГБЦ",
      description: "Прогар или продавливание прокладки головки блока цилиндров.",
      system: "Двигатель", symptoms: ["Белый дым из выхлопной", "Перегрев двигателя", "Масло в антифризе", "Антифриз в масле"],
      causes: ["Перегрев двигателя", "Несвоевременная протяжка ГБЦ", "Использование некачественного антифриза"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 3 }, { from: 3000, to: 5000, probability: 10 }, { from: 5000, to: 8000, probability: 20 }],
      baseProbabilityPer1000h: 3, repairCostRub: { min: 5000, avg: 12000, max: 20000 }, downtimeDays: { min: 1, avg: 2, max: 3 },
      severity: "high", fieldRepairable: false, seasonality: ["summer"],
    },
    {
      id: "mtz82-front-axle", name: "Износ ПВМ (передний ведущий мост)",
      description: "Люфт и стук в переднем мосту, течь масла из редукторов.",
      system: "Ходовая", symptoms: ["Стук при повороте", "Течь масла из колёсных редукторов", "Увеличенный люфт руля"],
      causes: ["Работа в тяжёлых почвенных условиях", "Несвоевременная замена масла ПВМ", "Агрессивная эксплуатация"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 5 }, { from: 3000, to: 5000, probability: 15 }, { from: 5000, to: 7000, probability: 30 }],
      baseProbabilityPer1000h: 5, repairCostRub: { min: 15000, avg: 35000, max: 60000 }, downtimeDays: { min: 2, avg: 3, max: 5 },
      severity: "high", fieldRepairable: false,
    },
  ],
};

// ═══════════════════════════════════════════════
// РЕГЛАМЕНТ ТО + ПОЛОМКИ: КИРОВЕЦ К-7М
// ═══════════════════════════════════════════════

export const KIROVETS_K7M_PROFILE: ModelMaintenanceProfile = {
  modelId: "kirovets-k7m-300",
  schedule: [
    {
      intervalHours: 10, type: "ЕТО",
      tasks: [
        { name: "Проверка уровня масла, ОЖ, гидравлики", description: "", category: "engine", materials: [], laborHours: 0.3 },
        { name: "Осмотр шин и колёс", description: "Давление, повреждения", category: "chassis", materials: [], laborHours: 0.2 },
      ],
      materialsCostRub: 0, laborCostRub: 800,
    },
    {
      intervalHours: 125, type: "ТО-1",
      tasks: [
        { name: "Замена масла и фильтров двигателя", description: "ТМЗ V8, 32 л масла", category: "engine", materials: [{ name: "Масло 10W-40", quantity: "32 л", costRub: 8000 }, { name: "Фильтр масляный", quantity: "2 шт", costRub: 1800 }], laborHours: 1 },
        { name: "Замена топливных фильтров", description: "", category: "fuel", materials: [{ name: "Фильтр топливный", quantity: "2 шт", costRub: 1500 }], laborHours: 0.5 },
        { name: "Смазка карданных валов", description: "Литол-24", category: "transmission", materials: [{ name: "Литол-24", quantity: "2 кг", costRub: 600 }], laborHours: 1 },
      ],
      materialsCostRub: 11900, laborCostRub: 5000,
    },
    {
      intervalHours: 500, type: "ТО-2",
      tasks: [
        { name: "Все работы ТО-1", description: "", category: "engine", materials: [], laborHours: 0 },
        { name: "Замена масла КПП", description: "80 л трансмиссионного масла", category: "transmission", materials: [{ name: "Масло ТМ-5-18", quantity: "80 л", costRub: 16000 }], laborHours: 1.5 },
        { name: "Замена масла гидросистемы", description: "120 л", category: "hydraulics", materials: [{ name: "Масло ВМГЗ", quantity: "120 л", costRub: 18000 }], laborHours: 2 },
        { name: "Регулировка клапанов ТМЗ", description: "8 цилиндров", category: "engine", materials: [], laborHours: 4 },
        { name: "Замена воздушных фильтров", description: "Основной + предохранительный", category: "engine", materials: [{ name: "Фильтр воздушный комплект", quantity: "1 шт", costRub: 3500 }], laborHours: 0.3 },
      ],
      materialsCostRub: 49400, laborCostRub: 15000,
    },
    {
      intervalHours: 1000, type: "ТО-3",
      tasks: [
        { name: "Все работы ТО-2", description: "", category: "engine", materials: [], laborHours: 0 },
        { name: "Замена ОЖ", description: "60 л", category: "cooling", materials: [{ name: "Антифриз", quantity: "60 л", costRub: 9000 }], laborHours: 1 },
        { name: "Проверка и ремонт ТНВД", description: "", category: "fuel", materials: [], laborHours: 4 },
        { name: "Ревизия ходовой", description: "Подшипники ступиц, рулевые тяги, шкворни", category: "chassis", materials: [{ name: "Подшипники, сальники", quantity: "комплект", costRub: 12000 }], laborHours: 6 },
        { name: "Проверка рамы на трещины", description: "Особенно в зоне сочленения", category: "body", materials: [], laborHours: 2 },
      ],
      materialsCostRub: 70400, laborCostRub: 40000,
    },
  ],
  commonFailures: [
    {
      id: "k7m-kpp-friction", name: "Износ фрикционов КПП",
      description: "Пробуксовка фрикционных дисков в КПП. Самая дорогая поломка Кировца.",
      system: "КПП", symptoms: ["Пробуксовка на передаче под нагрузкой", "Рывки при переключении", "Перегрев масла КПП", "Давление масла КПП ниже 8.5 кгс/см²"],
      causes: ["Работа при пониженном давлении масла КПП", "Медленное отпускание педали слива", "Перегрузка трактора", "Загрязнённое масло"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 3 }, { from: 3000, to: 6000, probability: 12 }, { from: 6000, to: 9000, probability: 30 }, { from: 9000, to: 12000, probability: 50 }],
      baseProbabilityPer1000h: 4, repairCostRub: { min: 80000, avg: 150000, max: 250000 }, downtimeDays: { min: 3, avg: 7, max: 14 },
      severity: "critical", fieldRepairable: false, seasonality: ["spring", "autumn"],
    },
    {
      id: "k7m-articulation", name: "Износ шарнира сочленения",
      description: "Люфт и стук в сочленении рамы. Характерная проблема шарнирно-сочленённых тракторов.",
      system: "Рама", symptoms: ["Стук при повороте", "Люфт кабины", "Неравномерный износ шин"],
      causes: ["Работа на неровных полях", "Большие тяговые нагрузки", "Естественный износ подшипников"],
      probabilityByHours: [{ from: 0, to: 4000, probability: 5 }, { from: 4000, to: 8000, probability: 15 }, { from: 8000, to: 12000, probability: 35 }],
      baseProbabilityPer1000h: 3, repairCostRub: { min: 40000, avg: 80000, max: 150000 }, downtimeDays: { min: 2, avg: 5, max: 10 },
      severity: "high", fieldRepairable: false,
    },
    {
      id: "k7m-turbo", name: "Отказ турбокомпрессора",
      description: "Падение мощности, чёрный/синий дым.",
      system: "Двигатель", symptoms: ["Падение мощности", "Чёрный дым", "Свист/вой турбины", "Масло в интеркулере"],
      causes: ["Загрязнённый воздушный фильтр", "Масляное голодание", "Попадание посторонних предметов", "Перегрев"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 2 }, { from: 3000, to: 6000, probability: 8 }, { from: 6000, to: 10000, probability: 18 }],
      baseProbabilityPer1000h: 2.5, repairCostRub: { min: 30000, avg: 60000, max: 120000 }, downtimeDays: { min: 1, avg: 3, max: 7 },
      severity: "high", fieldRepairable: false,
    },
    {
      id: "k7m-hydraulic-cylinders", name: "Течь гидроцилиндров",
      description: "Утечка масла из гидроцилиндров навески или рулевого.",
      system: "Гидравлика", symptoms: ["Следы масла под трактором", "Медленная работа навески", "Необходимость частого доливания масла"],
      causes: ["Износ уплотнений", "Задиры на штоке", "Работа в пыльных условиях"],
      probabilityByHours: [{ from: 0, to: 2000, probability: 5 }, { from: 2000, to: 5000, probability: 15 }, { from: 5000, to: 8000, probability: 25 }],
      baseProbabilityPer1000h: 5, repairCostRub: { min: 5000, avg: 15000, max: 30000 }, downtimeDays: { min: 0.5, avg: 1, max: 2 },
      severity: "medium", fieldRepairable: true,
    },
  ],
};

// ═══════════════════════════════════════════════
// РЕГЛАМЕНТ ТО + ПОЛОМКИ: ACROS 595 Plus
// ═══════════════════════════════════════════════

export const ACROS_595_PROFILE: ModelMaintenanceProfile = {
  modelId: "acros-595-plus",
  schedule: [
    {
      intervalHours: 10, type: "ЕТО",
      tasks: [
        { name: "Проверка уровней жидкостей", description: "Масло, ОЖ, гидравлика", category: "engine", materials: [], laborHours: 0.3 },
        { name: "Проверка натяжения ремней и цепей", description: "Привод молотилки, измельчителя", category: "harvesting_unit", materials: [], laborHours: 0.3 },
        { name: "Очистка радиаторов и воздухозаборников", description: "Критично при уборке — пыль и полова", category: "cooling", materials: [], laborHours: 0.4 },
        { name: "Проверка ножей жатки", description: "Заточка, замена при износе", category: "harvesting_unit", materials: [], laborHours: 0.3 },
      ],
      materialsCostRub: 0, laborCostRub: 1500,
    },
    {
      intervalHours: 60, type: "ТО-1",
      tasks: [
        { name: "Замена масла и фильтров двигателя", description: "ЯМЗ, 15 л масла", category: "engine", materials: [{ name: "Масло 15W-40", quantity: "15 л", costRub: 4500 }, { name: "Фильтр масляный", quantity: "1 шт", costRub: 1200 }], laborHours: 1 },
        { name: "Замена топливных фильтров", description: "", category: "fuel", materials: [{ name: "Фильтр топливный", quantity: "2 шт", costRub: 1800 }], laborHours: 0.5 },
        { name: "Смазка подшипников молотилки", description: "30+ точек смазки", category: "harvesting_unit", materials: [{ name: "Литол-24", quantity: "5 кг", costRub: 1500 }], laborHours: 2 },
        { name: "Проверка зазора подбарабанья", description: "Регулировка 2-18 мм", category: "harvesting_unit", materials: [], laborHours: 0.5 },
      ],
      materialsCostRub: 9000, laborCostRub: 8000,
    },
    {
      intervalHours: 240, type: "ТО-2",
      tasks: [
        { name: "Все работы ТО-1", description: "", category: "engine", materials: [], laborHours: 0 },
        { name: "Замена масла гидросистемы", description: "80 л", category: "hydraulics", materials: [{ name: "Масло ВМГЗ", quantity: "80 л", costRub: 12000 }], laborHours: 1.5 },
        { name: "Замена ремней привода", description: "При износе", category: "harvesting_unit", materials: [{ name: "Ремень привода комплект", quantity: "1 шт", costRub: 8000 }], laborHours: 3 },
        { name: "Проверка элеваторов и шнеков", description: "Целостность цепей, звёздочек", category: "harvesting_unit", materials: [{ name: "Звёздочки, пальцы", quantity: "комплект", costRub: 5000 }], laborHours: 3 },
        { name: "Регулировка молотильного барабана", description: "Биение, балансировка", category: "harvesting_unit", materials: [], laborHours: 2 },
      ],
      materialsCostRub: 34000, laborCostRub: 20000,
    },
  ],
  commonFailures: [
    {
      id: "acros-incline-reducer", name: "Износ редуктора наклонной камеры",
      description: "Итальянские редукторы — слабое место. Запчасти дорогие, у дилера отсутствуют.",
      system: "Молотильный аппарат", symptoms: ["Скрежет в наклонной камере", "Рывки при подаче массы", "Заклинивание транспортёра"],
      causes: ["Попадание камней и металлических предметов", "Перегрузка подачей массы", "Несвоевременная смазка"],
      probabilityByHours: [{ from: 0, to: 1000, probability: 3 }, { from: 1000, to: 2000, probability: 10 }, { from: 2000, to: 3000, probability: 22 }],
      baseProbabilityPer1000h: 4, repairCostRub: { min: 40000, avg: 85000, max: 150000 }, downtimeDays: { min: 2, avg: 5, max: 10 },
      severity: "critical", fieldRepairable: false, seasonality: ["summer"],
    },
    {
      id: "acros-auger-jam", name: "Забивание выгрузного шнека",
      description: "Застревание зерна в выгрузном шнеке, остановка выгрузки.",
      system: "Бункер", symptoms: ["Шнек не вращается", "Перегрев привода", "Зерно не выгружается"],
      causes: ["Влажное зерно", "Засор подшнекового пространства", "Износ спирали шнека"],
      probabilityByHours: [{ from: 0, to: 500, probability: 8 }, { from: 500, to: 1500, probability: 15 }, { from: 1500, to: 3000, probability: 25 }],
      baseProbabilityPer1000h: 10, repairCostRub: { min: 3000, avg: 10000, max: 25000 }, downtimeDays: { min: 0.1, avg: 0.3, max: 1 },
      severity: "medium", fieldRepairable: true, seasonality: ["summer"],
    },
    {
      id: "acros-sieve-wear", name: "Износ решёт очистки",
      description: "Увеличение потерь зерна при обмолоте.",
      system: "Очистка", symptoms: ["Зерно в половой фракции", "Увеличение потерь за комбайном", "Неравномерная очистка"],
      causes: ["Абразивный износ", "Уборка засорённых полей", "Большой налёт за сезон"],
      probabilityByHours: [{ from: 0, to: 1000, probability: 5 }, { from: 1000, to: 2000, probability: 20 }, { from: 2000, to: 3000, probability: 40 }],
      baseProbabilityPer1000h: 7, repairCostRub: { min: 15000, avg: 30000, max: 50000 }, downtimeDays: { min: 0.5, avg: 1, max: 2 },
      severity: "medium", fieldRepairable: false, seasonality: ["summer"],
    },
    {
      id: "acros-header-knife", name: "Поломка ножей жатки",
      description: "Сколы и поломки сегментов ножей при попадании камней.",
      system: "Жатка", symptoms: ["Неровный срез стеблей", "Стук в жатке", "Обматывание на вал"],
      causes: ["Камни в поле", "Полёглый хлеб", "Низкий срез"],
      probabilityByHours: [{ from: 0, to: 200, probability: 15 }, { from: 200, to: 500, probability: 25 }, { from: 500, to: 1000, probability: 40 }],
      baseProbabilityPer1000h: 25, repairCostRub: { min: 2000, avg: 5000, max: 12000 }, downtimeDays: { min: 0.1, avg: 0.2, max: 0.5 },
      severity: "low", fieldRepairable: true, seasonality: ["summer"],
    },
  ],
};

// ═══════════════════════════════════════════════
// ПРОФИЛИ ТО ДЛЯ КАМАЗ-65115
// ═══════════════════════════════════════════════

export const KAMAZ_65115_PROFILE: ModelMaintenanceProfile = {
  modelId: "kamaz-65115",
  schedule: [
    {
      intervalHours: 125, type: "ТО-1",
      tasks: [
        { name: "Замена масла и фильтров двигателя", description: "КАМАЗ-740, 26 л", category: "engine", materials: [{ name: "Масло 15W-40", quantity: "26 л", costRub: 6500 }, { name: "Фильтр масляный", quantity: "2 шт", costRub: 1200 }], laborHours: 1 },
        { name: "Проверка тормозной системы", description: "Колодки, шланги, утечки", category: "chassis", materials: [], laborHours: 1 },
      ],
      materialsCostRub: 7700, laborCostRub: 4000,
    },
  ],
  commonFailures: [
    {
      id: "kamaz-cooling-leak", name: "Утечка системы охлаждения",
      description: "Нарушение герметичности — течь патрубков, радиатора, ГБЦ.",
      system: "Охлаждение", symptoms: ["Перегрев двигателя", "Следы антифриза", "Снижение уровня ОЖ"],
      causes: ["Износ патрубков и хомутов", "Вибрация", "Некачественный антифриз"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 10 }, { from: 3000, to: 6000, probability: 25 }, { from: 6000, to: 10000, probability: 40 }],
      baseProbabilityPer1000h: 8, repairCostRub: { min: 2000, avg: 8000, max: 25000 }, downtimeDays: { min: 0.2, avg: 0.5, max: 2 },
      severity: "medium", fieldRepairable: true,
    },
    {
      id: "kamaz-dump-hydraulic", name: "Неисправность гидроцилиндра подъёма кузова",
      description: "Кузов не поднимается или не опускается полностью.",
      system: "Гидравлика", symptoms: ["Кузов не поднимается", "Медленный подъём", "Течь масла из цилиндра", "Кузов не фиксируется"],
      causes: ["Износ уплотнений", "Засор маслоканалов", "Неисправность КОМ"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 5 }, { from: 3000, to: 6000, probability: 18 }, { from: 6000, to: 10000, probability: 30 }],
      baseProbabilityPer1000h: 5, repairCostRub: { min: 10000, avg: 25000, max: 50000 }, downtimeDays: { min: 0.5, avg: 1, max: 3 },
      severity: "high", fieldRepairable: false,
    },
    {
      id: "kamaz-clutch", name: "Износ сцепления",
      description: "Пробуксовка, трудности переключения — перегрузка и агрессивная эксплуатация.",
      system: "Трансмиссия", symptoms: ["Пробуксовка", "Трудности переключения", "Запах горелого"],
      causes: ["Перегрузка", "Агрессивная езда по полям", "Несвоевременная регулировка"],
      probabilityByHours: [{ from: 0, to: 3000, probability: 3 }, { from: 3000, to: 6000, probability: 12 }, { from: 6000, to: 10000, probability: 25 }],
      baseProbabilityPer1000h: 4, repairCostRub: { min: 15000, avg: 30000, max: 55000 }, downtimeDays: { min: 1, avg: 2, max: 4 },
      severity: "high", fieldRepairable: false,
    },
  ],
};

// ═══════════════════════════════════════════════
// ИНДЕКС ВСЕХ ПРОФИЛЕЙ
// ═══════════════════════════════════════════════

export const ALL_PROFILES: ModelMaintenanceProfile[] = [
  MTZ_82_PROFILE,
  KIROVETS_K7M_PROFILE,
  ACROS_595_PROFILE,
  KAMAZ_65115_PROFILE,
];

export function getMaintenanceProfile(modelId: string): ModelMaintenanceProfile | undefined {
  return ALL_PROFILES.find((p) => p.modelId === modelId);
}

/** Получить все поломки для модели с текущей вероятностью */
export function getFailureRisks(modelId: string, currentHours: number): (CommonFailure & { currentProbability: number })[] {
  const profile = getMaintenanceProfile(modelId);
  if (!profile) return [];

  return profile.commonFailures.map((f) => {
    const range = f.probabilityByHours.find((r) => currentHours >= r.from && currentHours < r.to);
    const currentProbability = range?.probability ?? f.probabilityByHours[f.probabilityByHours.length - 1]?.probability ?? 0;
    return { ...f, currentProbability };
  });
}
