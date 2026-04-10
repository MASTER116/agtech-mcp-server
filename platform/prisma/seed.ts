import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database (российский рынок)...\n");

  const passwordHash = await hash("demo123", 12);

  // ═══ Пользователь + Организация ═══
  const user = await prisma.user.upsert({
    where: { email: "demo@azat.farm" },
    update: {},
    create: {
      email: "demo@azat.farm",
      name: "Алексей Волков",
      phone: "+7 (918) 555-12-34",
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          org: {
            create: {
              name: 'КФХ "Волков А.И."',
              slug: "kfh-volkov",
              description: "Крестьянско-фермерское хозяйство. Зерновые, подсолнечник. Краснодарский край.",
              apiKey: "azat_demo_api_key_kfh_volkov",
              centerLat: 45.35, // Краснодарский край
              centerLon: 40.22,
              timezone: "Europe/Moscow",
            },
          },
        },
      },
    },
    include: { memberships: true },
  });

  const orgId = user.memberships[0].orgId;

  // ═══ Второй пользователь (механизатор) ═══
  const operator = await prisma.user.upsert({
    where: { email: "ivan@azat.farm" },
    update: {},
    create: {
      email: "ivan@azat.farm",
      name: "Иван Кузнецов",
      phone: "+7 (918) 555-56-78",
      passwordHash,
      memberships: {
        create: {
          role: "OPERATOR",
          orgId,
        },
      },
    },
  });

  console.log(`Организация: КФХ "Волков А.И." (${orgId})`);

  // ═══ ТЕХНИКА (реальные модели российского рынка) ═══
  const equipment = await Promise.all([
    // Тракторы
    prisma.equipment.create({
      data: {
        orgId,
        name: "Кировец К-7М",
        category: "TRACTOR",
        make: "ПТЗ",
        model: "К-7М 300",
        year: 2022,
        status: "ACTIVE",
        fuelType: "diesel",
        engineHours: 3_200,
        purchasePrice: 10_500_000,
        latitude: 45.36,
        longitude: 40.21,
        lastPositionAt: new Date(),
        notes: "Основной трактор. Тяговый класс 5. Двигатель ТМЗ-8481.10, 300 л.с.",
      },
    }),
    prisma.equipment.create({
      data: {
        orgId,
        name: "БЕЛАРУС-1221.2",
        category: "TRACTOR",
        make: "МТЗ",
        model: "1221.2",
        year: 2023,
        status: "ACTIVE",
        fuelType: "diesel",
        engineHours: 1_850,
        purchasePrice: 4_800_000,
        latitude: 45.34,
        longitude: 40.19,
        lastPositionAt: new Date(),
        notes: "Универсальный трактор. Двигатель Д-260.2, 136 л.с. 4WD.",
      },
    }),
    prisma.equipment.create({
      data: {
        orgId,
        name: "БЕЛАРУС-82.1",
        category: "TRACTOR",
        make: "МТЗ",
        model: "82.1",
        year: 2021,
        status: "IDLE",
        fuelType: "diesel",
        engineHours: 4_500,
        purchasePrice: 2_680_000,
        latitude: 45.35,
        longitude: 40.23,
        lastPositionAt: new Date(),
        notes: "Самый массовый трактор в России. 81 л.с. Расход 12-15 л/ч.",
      },
    }),
    // Комбайны
    prisma.equipment.create({
      data: {
        orgId,
        name: "ACROS 595 Plus",
        category: "GRAIN_COMBINE",
        make: "Ростсельмаш",
        model: "ACROS 595 Plus",
        year: 2023,
        status: "IDLE",
        fuelType: "diesel",
        engineHours: 650,
        purchasePrice: 12_000_000,
        latitude: 45.33,
        longitude: 40.25,
        lastPositionAt: new Date(),
        notes: "327 л.с., молотильный барабан 800мм (крупнейший в мире). До 25 т/ч. Бункер 9000 л.",
      },
    }),
    prisma.equipment.create({
      data: {
        orgId,
        name: "NOVA S300",
        category: "GRAIN_COMBINE",
        make: "Ростсельмаш",
        model: "NOVA S300",
        year: 2021,
        status: "IDLE",
        fuelType: "diesel",
        engineHours: 1_100,
        purchasePrice: 5_800_000,
        notes: "185 л.с. Начальный класс. Бункер 5000 л.",
      },
    }),
    // Опрыскиватель
    prisma.equipment.create({
      data: {
        orgId,
        name: "Туман-2",
        category: "SPRAYER",
        make: "Пегас-Агро",
        model: "Туман-2",
        year: 2022,
        status: "IDLE",
        fuelType: "diesel",
        engineHours: 380,
        purchasePrice: 5_800_000,
        latitude: 45.37,
        longitude: 40.20,
        lastPositionAt: new Date(),
        notes: "Единственный российский самоходный опрыскиватель. Переоборудуется за 3 часа в разбрасыватель/сеялку.",
      },
    }),
    // Сеялка
    prisma.equipment.create({
      data: {
        orgId,
        name: "Сеялка СЗ-5,4",
        category: "SEEDER",
        make: "Ростсельмаш",
        model: "СЗ-5,4",
        year: 2023,
        status: "IDLE",
        purchasePrice: 1_200_000,
        notes: "Зернотуковая сеялка, ширина 5.4 м.",
      },
    }),
    // Культиватор
    prisma.equipment.create({
      data: {
        orgId,
        name: "КПС-8",
        category: "CULTIVATOR",
        make: "БДМ-Агро",
        model: "КПС-8",
        year: 2022,
        status: "IDLE",
        purchasePrice: 850_000,
        notes: "Культиватор прицепной стерневой, ширина 8 м.",
      },
    }),
    // Плуг
    prisma.equipment.create({
      data: {
        orgId,
        name: "Плуг ПЛН-5-35",
        category: "PLOW",
        make: "Рубцовск",
        model: "ПЛН-5-35",
        year: 2020,
        status: "IDLE",
        purchasePrice: 320_000,
        notes: "5-корпусный плуг, глубина до 30 см.",
      },
    }),
    // Грузовик
    prisma.equipment.create({
      data: {
        orgId,
        name: "КАМАЗ-65115",
        category: "TRUCK",
        make: "КАМАЗ",
        model: "65115",
        year: 2023,
        status: "ACTIVE",
        fuelType: "diesel",
        engineHours: 2_800,
        purchasePrice: 5_200_000,
        latitude: 45.35,
        longitude: 40.22,
        lastPositionAt: new Date(),
        notes: "Самосвал 15 т. Двигатель КАМАЗ-740, 280 л.с.",
      },
    }),
    // Борона
    prisma.equipment.create({
      data: {
        orgId,
        name: "БДТ-7",
        category: "HARROW",
        make: "БДМ-Агро",
        model: "БДТ-7",
        year: 2021,
        status: "IDLE",
        purchasePrice: 680_000,
        notes: "Борона дисковая тяжёлая, ширина 7 м.",
      },
    }),
    // Разбрасыватель удобрений
    prisma.equipment.create({
      data: {
        orgId,
        name: "РУМ-8",
        category: "FERTILIZER_SPREADER",
        make: "Бобруйскагромаш",
        model: "РУМ-8",
        year: 2022,
        status: "IDLE",
        purchasePrice: 950_000,
        notes: "Машина для внесения минеральных удобрений, ёмкость 8 т.",
      },
    }),
  ]);

  console.log(`Создано ${equipment.length} единиц техники`);

  // ═══ ПОЛЯ (Краснодарский край) ═══
  const fields = await Promise.all([
    prisma.field.create({
      data: {
        orgId,
        name: "Поле №1 — Южное",
        areaHa: 250,
        centerLat: 45.30,
        centerLon: 40.15,
        soilType: "Чернозём обыкновенный",
        notes: "Основное поле под озимую пшеницу. Бонитет 78.",
        boundary: {
          type: "Polygon",
          coordinates: [[[40.10, 45.28], [40.20, 45.28], [40.20, 45.32], [40.10, 45.32], [40.10, 45.28]]],
        },
        cropSeasons: {
          create: [
            { cropName: "Пшеница озимая", variety: "Алексеич", seasonYear: 2026, plantedAt: new Date("2025-09-20"), expectedYieldKgHa: 5_500 },
            { cropName: "Подсолнечник", variety: "Лакомка", seasonYear: 2025, plantedAt: new Date("2025-04-15"), harvestedAt: new Date("2025-09-10"), yieldKgHa: 2_100 },
            { cropName: "Пшеница озимая", variety: "Гром", seasonYear: 2024, plantedAt: new Date("2023-09-25"), harvestedAt: new Date("2024-07-05"), yieldKgHa: 5_200 },
          ],
        },
      },
    }),
    prisma.field.create({
      data: {
        orgId,
        name: "Поле №2 — Придорожное",
        areaHa: 180,
        centerLat: 45.35,
        centerLon: 40.28,
        soilType: "Чернозём выщелоченный",
        notes: "Ротация: подсолнечник → озимая пшеница → кукуруза.",
        boundary: {
          type: "Polygon",
          coordinates: [[[40.23, 45.33], [40.33, 45.33], [40.33, 45.37], [40.23, 45.37], [40.23, 45.33]]],
        },
        cropSeasons: {
          create: [
            { cropName: "Кукуруза", variety: "Краснодарский 385 МВ", seasonYear: 2026, expectedYieldKgHa: 6_000 },
            { cropName: "Пшеница озимая", variety: "Таня", seasonYear: 2025, plantedAt: new Date("2024-09-18"), harvestedAt: new Date("2025-07-01"), yieldKgHa: 4_800 },
          ],
        },
      },
    }),
    prisma.field.create({
      data: {
        orgId,
        name: "Поле №3 — За рекой",
        areaHa: 320,
        centerLat: 45.40,
        centerLon: 40.10,
        soilType: "Чернозём типичный",
        notes: "Крупнейшее поле. Сахарная свёкла в ротации.",
        boundary: {
          type: "Polygon",
          coordinates: [[[40.05, 45.38], [40.15, 45.38], [40.15, 45.42], [40.05, 45.42], [40.05, 45.38]]],
        },
        cropSeasons: {
          create: [
            { cropName: "Сахарная свёкла", variety: "Каскад", seasonYear: 2026, expectedYieldKgHa: 48_000 },
          ],
        },
      },
    }),
    prisma.field.create({
      data: {
        orgId,
        name: "Поле №4 — Лесополоса",
        areaHa: 95,
        centerLat: 45.38,
        centerLon: 40.30,
        soilType: "Серая лесная",
        boundary: {
          type: "Polygon",
          coordinates: [[[40.27, 45.36], [40.33, 45.36], [40.33, 45.40], [40.27, 45.40], [40.27, 45.36]]],
        },
        cropSeasons: {
          create: [
            { cropName: "Горох", variety: "Аксайский усатый 55", seasonYear: 2026, expectedYieldKgHa: 2_200 },
          ],
        },
      },
    }),
  ]);

  console.log(`Создано ${fields.length} поля (всего ${250 + 180 + 320 + 95} га)`);

  // ═══ ЗАДАЧИ (весенний сезон 2026) ═══
  const now = new Date();
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        type: "FERTILIZING",
        status: "PLANNED",
        title: "Ранневесенняя подкормка озимой пшеницы",
        description: "Аммиачная селитра 200 кг/га по мёрзло-талой почве",
        plannedStartAt: new Date(now.getTime() + 3 * 86_400_000),
        plannedEndAt: new Date(now.getTime() + 5 * 86_400_000),
        assignedToId: operator.id,
        inputProduct: "Аммиачная селитра (NH₄NO₃)",
        inputRateKgHa: 200,
        inputTotalKg: 50_000,
        estimatedCost: 750_000,
        equipment: { create: [{ equipmentId: equipment[0].id }, { equipmentId: equipment[11].id }] },
      },
    }),
    prisma.activity.create({
      data: {
        orgId,
        fieldId: fields[1].id,
        type: "SEEDING",
        status: "PLANNED",
        title: "Посев кукурузы",
        description: "Температура почвы на глубине 10 см не менее +10°C",
        plannedStartAt: new Date(now.getTime() + 25 * 86_400_000),
        plannedEndAt: new Date(now.getTime() + 30 * 86_400_000),
        inputProduct: "Семена кукурузы Краснодарский 385 МВ",
        inputRateKgHa: 22,
        estimatedCost: 980_000,
        weatherMinTemp: 10,
        equipment: { create: [{ equipmentId: equipment[0].id }, { equipmentId: equipment[6].id }] },
      },
    }),
    prisma.activity.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        type: "SPRAYING",
        status: "PLANNED",
        title: "Гербицидная обработка пшеницы",
        description: "Обработка от двудольных сорняков. Ветер не более 5 м/с.",
        plannedStartAt: new Date(now.getTime() + 10 * 86_400_000),
        plannedEndAt: new Date(now.getTime() + 12 * 86_400_000),
        assignedToId: operator.id,
        inputProduct: "Балерина, СЭ",
        inputRateKgHa: 0.5,
        estimatedCost: 320_000,
        weatherMaxWind: 5,
        equipment: { create: { equipmentId: equipment[5].id } },
      },
    }),
    prisma.activity.create({
      data: {
        orgId,
        fieldId: fields[2].id,
        type: "CULTIVATION",
        status: "PLANNED",
        title: "Предпосевная культивация под свёклу",
        plannedStartAt: new Date(now.getTime() + 20 * 86_400_000),
        plannedEndAt: new Date(now.getTime() + 23 * 86_400_000),
        estimatedCost: 280_000,
        equipment: { create: [{ equipmentId: equipment[0].id }, { equipmentId: equipment[7].id }] },
      },
    }),
    prisma.activity.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        type: "HARVESTING",
        status: "PLANNED",
        title: "Уборка озимой пшеницы",
        description: "Влажность зерна не более 14%. Два комбайна.",
        plannedStartAt: new Date("2026-07-01"),
        plannedEndAt: new Date("2026-07-10"),
        estimatedCost: 1_200_000,
        equipment: { create: [{ equipmentId: equipment[3].id }, { equipmentId: equipment[4].id }, { equipmentId: equipment[9].id }] },
      },
    }),
    // Завершённые
    prisma.activity.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        type: "PLOWING",
        status: "COMPLETED",
        title: "Осенняя вспашка после подсолнечника",
        plannedStartAt: new Date("2025-09-15"),
        plannedEndAt: new Date("2025-09-20"),
        actualStartAt: new Date("2025-09-15"),
        actualEndAt: new Date("2025-09-19"),
        actualCost: 410_000,
        equipment: { create: [{ equipmentId: equipment[0].id }, { equipmentId: equipment[8].id }] },
      },
    }),
    prisma.activity.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        type: "SEEDING",
        status: "COMPLETED",
        title: "Посев озимой пшеницы Алексеич",
        plannedStartAt: new Date("2025-09-20"),
        plannedEndAt: new Date("2025-09-25"),
        actualStartAt: new Date("2025-09-20"),
        actualEndAt: new Date("2025-09-24"),
        actualCost: 1_800_000,
        inputProduct: "Семена пшеницы Алексеич",
        inputRateKgHa: 220,
      },
    }),
  ]);

  console.log(`Создано ${activities.length} задач`);

  // ═══ ДАТЧИКИ ═══
  const sensors = await Promise.all([
    prisma.sensor.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        deviceId: "SM-KRD-001",
        name: "Влажность почвы (Южное, 20 см)",
        type: "SOIL_MOISTURE",
        unit: "%",
        latitude: 45.30,
        longitude: 40.15,
        isOnline: true,
        batteryPct: 78,
        lastReadAt: now,
        readings: {
          create: Array.from({ length: 48 }, (_, i) => ({
            value: 28 + Math.sin(i / 6) * 8 + Math.random() * 3,
            recordedAt: new Date(now.getTime() - i * 30 * 60 * 1000),
          })),
        },
      },
    }),
    prisma.sensor.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        deviceId: "ST-KRD-001",
        name: "Температура почвы (Южное, 10 см)",
        type: "SOIL_TEMPERATURE",
        unit: "°C",
        latitude: 45.305,
        longitude: 40.155,
        isOnline: true,
        batteryPct: 85,
        lastReadAt: now,
        readings: {
          create: Array.from({ length: 48 }, (_, i) => ({
            value: 6 + Math.sin(i / 8) * 3 + Math.random() * 1.5,
            recordedAt: new Date(now.getTime() - i * 30 * 60 * 1000),
          })),
        },
      },
    }),
    prisma.sensor.create({
      data: {
        orgId,
        fieldId: fields[1].id,
        deviceId: "PH-KRD-001",
        name: "pH почвы (Придорожное)",
        type: "PH_METER",
        unit: "pH",
        latitude: 45.35,
        longitude: 40.28,
        isOnline: true,
        batteryPct: 62,
        lastReadAt: now,
        readings: {
          create: Array.from({ length: 24 }, (_, i) => ({
            value: 6.4 + Math.random() * 0.6,
            recordedAt: new Date(now.getTime() - i * 60 * 60 * 1000),
          })),
        },
      },
    }),
    prisma.sensor.create({
      data: {
        orgId,
        fieldId: fields[0].id,
        deviceId: "AT-KRD-001",
        name: "Метеостанция (Южное поле)",
        type: "AIR_TEMPERATURE",
        unit: "°C",
        latitude: 45.31,
        longitude: 40.16,
        isOnline: true,
        batteryPct: 91,
        lastReadAt: now,
        readings: {
          create: Array.from({ length: 48 }, (_, i) => ({
            value: 12 + Math.sin(i / 12) * 8 + Math.random() * 2,
            recordedAt: new Date(now.getTime() - i * 30 * 60 * 1000),
          })),
        },
      },
    }),
    prisma.sensor.create({
      data: {
        orgId,
        fieldId: fields[2].id,
        deviceId: "FD-KRD-001",
        name: "Глубина удобрения (За рекой)",
        type: "FERTILIZER_DEPTH",
        unit: "см",
        latitude: 45.40,
        longitude: 40.10,
        isOnline: false,
        batteryPct: 12,
        readings: {
          create: Array.from({ length: 10 }, (_, i) => ({
            value: 8 + Math.random() * 4,
            recordedAt: new Date(now.getTime() - i * 3 * 60 * 60 * 1000),
          })),
        },
      },
    }),
  ]);

  console.log(`Создано ${sensors.length} датчиков`);

  // ═══ МАРКЕТПЛЕЙС ═══
  await Promise.all([
    prisma.marketplaceListing.create({
      data: {
        orgId,
        equipmentId: equipment[3].id, // ACROS 595
        type: "RENTAL",
        status: "ACTIVE",
        title: "Комбайн ACROS 595 Plus — аренда на уборку 2026",
        description: "Комбайн Ростсельмаш ACROS 595 Plus, 2023 г.в., 650 моточасов. 327 л.с., жатка 7 м. В отличном состоянии. Доступен июль-август. Можно с механизатором.",
        pricePerDay: 45_000,
        pricePerHa: 4_500,
        suggestedPrice: 42_000,
        availableFrom: new Date("2026-07-01"),
        availableTo: new Date("2026-08-31"),
        regionName: "Краснодарский край",
        latitude: 45.33,
        longitude: 40.25,
        radiusKm: 150,
      },
    }),
    prisma.marketplaceListing.create({
      data: {
        orgId,
        equipmentId: equipment[5].id, // Туман-2
        type: "SERVICE",
        status: "ACTIVE",
        title: "Услуги опрыскивания — Туман-2",
        description: "Самоходный опрыскиватель Пегас-Агро Туман-2. Обработка полей от сорняков и вредителей. Опыт работы 5 лет. Весь Краснодарский край.",
        pricePerHa: 800,
        suggestedPrice: 750,
        availableFrom: new Date("2026-04-01"),
        availableTo: new Date("2026-09-30"),
        regionName: "Краснодарский край",
        latitude: 45.37,
        longitude: 40.20,
        radiusKm: 200,
      },
    }),
  ]);

  console.log("Создано 2 объявления на маркетплейсе");

  // ═══ ОБСЛУЖИВАНИЕ ═══
  await Promise.all([
    prisma.maintenanceRecord.create({
      data: {
        orgId,
        equipmentId: equipment[3].id, // ACROS
        type: "SCHEDULED",
        title: "ТО-1 комбайна ACROS перед уборкой",
        description: "Замена масла, фильтров, проверка ножей и подбарабанья. Регулировка молотильного аппарата.",
        scheduledAt: new Date("2026-06-15"),
        cost: 85_000,
        engineHoursAtService: 650,
        nextServiceHours: 900,
      },
    }),
    prisma.maintenanceRecord.create({
      data: {
        orgId,
        equipmentId: equipment[0].id, // Кировец
        type: "SCHEDULED",
        title: "ТО-2 Кировец К-7М (3000 м/ч)",
        description: "Замена масла двигателя и трансмиссии, топливных и воздушных фильтров. Проверка ходовой.",
        scheduledAt: new Date(now.getTime() + 14 * 86_400_000),
        cost: 120_000,
        engineHoursAtService: 3_200,
        nextServiceAt: new Date("2026-09-01"),
        nextServiceHours: 3_500,
      },
    }),
    prisma.maintenanceRecord.create({
      data: {
        orgId,
        equipmentId: equipment[1].id, // БЕЛАРУС-1221
        type: "UNSCHEDULED",
        title: "Замена сцепления БЕЛАРУС-1221",
        completedAt: new Date("2026-02-15"),
        cost: 65_000,
        partsUsed: [
          { name: "Диск сцепления МТЗ-1221", quantity: 1, cost: 18_000 },
          { name: "Корзина сцепления", quantity: 1, cost: 22_000 },
          { name: "Выжимной подшипник", quantity: 1, cost: 3_500 },
        ],
        engineHoursAtService: 1_800,
      },
    }),
  ]);

  console.log("Создано 3 записи обслуживания");

  // ═══ Вторая организация (для маркетплейса) ═══
  const user2 = await prisma.user.upsert({
    where: { email: "petrov@azat.farm" },
    update: {},
    create: {
      email: "petrov@azat.farm",
      name: "Сергей Петров",
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          org: {
            create: {
              name: 'ООО "АгроРесурс"',
              slug: "agroresurs",
              apiKey: "azat_demo_api_key_agroresurs",
              centerLat: 46.10,
              centerLon: 39.70,
            },
          },
        },
      },
    },
    include: { memberships: true },
  });

  const org2Id = user2.memberships[0].orgId;

  // Техника второй организации (TORUM — крупный комбайн для аренды в сентябре)
  const eq2 = await prisma.equipment.create({
    data: {
      orgId: org2Id,
      name: "TORUM 785",
      category: "GRAIN_COMBINE",
      make: "Ростсельмаш",
      model: "TORUM 785",
      year: 2024,
      status: "IDLE",
      fuelType: "diesel",
      engineHours: 280,
      purchasePrice: 24_000_000,
    },
  });

  await prisma.marketplaceListing.create({
    data: {
      orgId: org2Id,
      equipmentId: eq2.id,
      type: "RENTAL",
      status: "ACTIVE",
      title: "TORUM 785 — аренда сентябрь-октябрь",
      description: "Флагман Ростсельмаш. 510 л.с., 45 т/ч. 280 моточасов. Идеален для уборки кукурузы и подсолнечника. Полное ТО пройдено.",
      pricePerDay: 80_000,
      pricePerHa: 5_500,
      suggestedPrice: 75_000,
      availableFrom: new Date("2026-09-01"),
      availableTo: new Date("2026-10-31"),
      regionName: "Ростовская область",
      latitude: 46.10,
      longitude: 39.70,
      radiusKm: 200,
    },
  });

  console.log("Создана вторая организация с техникой для маркетплейса");

  console.log("\n══════════════════════════════════════");
  console.log("  ДЕМО-ДАННЫЕ ЗАГРУЖЕНЫ");
  console.log("══════════════════════════════════════");
  console.log("  Логин: demo@azat.farm / demo123");
  console.log('  Организация: КФХ "Волков А.И."');
  console.log("  Техника: 12 единиц (Кировец, МТЗ, Ростсельмаш, КАМАЗ)");
  console.log("  Поля: 4 шт, 845 га (Краснодарский край)");
  console.log("  Задачи: 7 (весенний сезон 2026)");
  console.log("  Датчики: 5 шт с показаниями");
  console.log("  Маркетплейс: 3 объявления");
  console.log("  ТО: 3 записи");
  console.log("══════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
