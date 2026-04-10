/**
 * ИНТЕГРАЦИЯ С ФГИС «ЗЕРНО»
 *
 * Официальный API: https://specagro.ru/fgis
 * Документация API: скачивается с личного кабинета specagro.ru
 * Текущая версия API: 1.0.8+ (версии ниже 1.0.8 не поддерживаются с 01.10.2025)
 *
 * Продакшн: https://zerno.mcx.gov.ru
 * Тест:     https://test.zerno.mcx.gov.ru
 *
 * Требования:
 * - Регистрация юрлица на zerno.mcx.gov.ru
 * - Квалифицированная ЭЦП (УКЭП)
 * - Криптопровайдер (КриптоПро CSP)
 * - Сертификат загружен в личный кабинет ФГИС
 *
 * Основные операции:
 * - Создание СДИЗ (сопроводительный документ на зерно)
 * - Погашение СДИЗ при продаже
 * - Формирование партии зерна
 * - Получение статуса документа
 */

const FGIS_PROD_URL = "https://zerno.mcx.gov.ru/api/v1";
const FGIS_TEST_URL = "https://test.zerno.mcx.gov.ru/api/v1";

export interface FgisConfig {
  /** Использовать тестовый контур */
  useTestMode: boolean;
  /** ИНН организации */
  inn: string;
  /** Путь к сертификату ЭЦП (.pfx/.cer) */
  certPath?: string;
  /** Пароль сертификата */
  certPassword?: string;
  /** API-ключ (если выдан) */
  apiKey?: string;
}

export interface SdizRequest {
  /** ИНН отправителя */
  senderInn: string;
  /** ИНН получателя */
  receiverInn?: string;
  /** Код культуры по ОКПД2 */
  cropCode: string;
  /** Масса, кг */
  weightKg: number;
  /** Класс/сорт */
  qualityClass?: string;
  /** Влажность, % */
  moisture?: number;
  /** Засорённость, % */
  impurity?: number;
  /** Номер протокола испытаний */
  labProtocolNo?: string;
  /** Место хранения (адрес) */
  storageAddress?: string;
  /** Урожай года */
  harvestYear: number;
}

export interface SdizResponse {
  success: boolean;
  sdizNumber?: string;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
}

/** Коды культур ОКПД2 для ФГИС */
export const CROP_OKPD2: Record<string, { code: string; name: string }> = {
  "Пшеница озимая":   { code: "01.11.1", name: "Пшеница" },
  "Пшеница яровая":   { code: "01.11.1", name: "Пшеница" },
  "Ячмень яровой":    { code: "01.11.2", name: "Ячмень" },
  "Кукуруза":         { code: "01.11.3", name: "Кукуруза" },
  "Рожь":             { code: "01.11.4", name: "Рожь" },
  "Овёс":             { code: "01.11.5", name: "Овёс" },
  "Подсолнечник":     { code: "01.11.91", name: "Подсолнечник" },
  "Соя":              { code: "01.11.92", name: "Соя" },
  "Рапс":             { code: "01.11.94", name: "Рапс" },
  "Горох":            { code: "01.11.71", name: "Горох" },
  "Гречиха":          { code: "01.11.6", name: "Гречиха" },
  "Нут":              { code: "01.11.72", name: "Нут" },
  "Чечевица":         { code: "01.11.73", name: "Чечевица" },
};

/**
 * Класс для работы с API ФГИС «Зерно»
 *
 * В текущей реализации — подготовка данных и валидация.
 * Для реальной отправки нужен сертификат ЭЦП.
 */
export class FgisZernoClient {
  private baseUrl: string;
  private config: FgisConfig;

  constructor(config: FgisConfig) {
    this.config = config;
    this.baseUrl = config.useTestMode ? FGIS_TEST_URL : FGIS_PROD_URL;
  }

  /** Проверить готовность к отправке */
  checkReadiness(): { ready: boolean; missing: string[] } {
    const missing: string[] = [];
    if (!this.config.inn) missing.push("ИНН организации");
    if (!this.config.certPath) missing.push("Сертификат ЭЦП (УКЭП)");
    if (!this.config.certPassword && !this.config.apiKey) missing.push("Пароль сертификата или API-ключ");
    return { ready: missing.length === 0, missing };
  }

  /** Сформировать XML-запрос на создание СДИЗ (для отправки через КриптоПро) */
  buildSdizXml(request: SdizRequest): string {
    const cropInfo = Object.values(CROP_OKPD2).find(c => c.code === request.cropCode) || { code: request.cropCode, name: "Зерно" };

    return `<?xml version="1.0" encoding="UTF-8"?>
<sdiz xmlns="urn:fgis:zerno:sdiz:v1">
  <sender>
    <inn>${request.senderInn}</inn>
  </sender>
  ${request.receiverInn ? `<receiver><inn>${request.receiverInn}</inn></receiver>` : ""}
  <grain>
    <cropCode>${request.cropCode}</cropCode>
    <cropName>${cropInfo.name}</cropName>
    <weight unit="kg">${request.weightKg}</weight>
    ${request.qualityClass ? `<qualityClass>${request.qualityClass}</qualityClass>` : ""}
    ${request.moisture ? `<moisture>${request.moisture}</moisture>` : ""}
    ${request.impurity ? `<impurity>${request.impurity}</impurity>` : ""}
    <harvestYear>${request.harvestYear}</harvestYear>
  </grain>
  ${request.storageAddress ? `<storage><address>${request.storageAddress}</address></storage>` : ""}
  ${request.labProtocolNo ? `<labProtocol>${request.labProtocolNo}</labProtocol>` : ""}
</sdiz>`;
  }

  /** Отправить СДИЗ в ФГИС (требует ЭЦП) */
  async createSdiz(request: SdizRequest): Promise<SdizResponse> {
    const readiness = this.checkReadiness();
    if (!readiness.ready) {
      return {
        success: false,
        errorCode: "NOT_CONFIGURED",
        errorMessage: `Не настроено: ${readiness.missing.join(", ")}. Настройте ЭЦП в разделе Настройки → ФГИС Зерно.`,
      };
    }

    try {
      // В проде: подписание XML через КриптоПро CSP и отправка
      // const signedXml = await this.signXml(xml, this.config.certPath!, this.config.certPassword!);
      // const response = await fetch(`${this.baseUrl}/sdiz`, { method: 'POST', body: signedXml, headers: { 'Content-Type': 'application/xml' } });

      // Пока — имитация для тестового контура
      if (this.config.useTestMode) {
        const sdizNumber = `СДИЗ-${Date.now().toString(36).toUpperCase()}-ТЕСТ`;
        return { success: true, sdizNumber, status: "submitted" };
      }

      return {
        success: false,
        errorCode: "PROD_NOT_IMPLEMENTED",
        errorMessage: "Отправка в продакшн ФГИС требует подписания через КриптоПро. Используйте тестовый режим или настройте ЭЦП.",
      };
    } catch (error: any) {
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: `Ошибка связи с ФГИС: ${error.message}`,
      };
    }
  }

  /** Проверить статус СДИЗ */
  async checkSdizStatus(sdizNumber: string): Promise<{ status: string; details?: string }> {
    const readiness = this.checkReadiness();
    if (!readiness.ready) {
      return { status: "unknown", details: `Не настроено: ${readiness.missing.join(", ")}` };
    }

    // В проде: GET запрос к API ФГИС
    return { status: "pending", details: "Проверка статуса требует подключения к API ФГИС" };
  }
}

/**
 * Инструкция по настройке ФГИС «Зерно»
 */
export const FGIS_SETUP_GUIDE = {
  title: "Настройка интеграции с ФГИС «Зерно»",
  steps: [
    {
      step: 1,
      title: "Регистрация в системе",
      description: "Зарегистрируйтесь на портале zerno.mcx.gov.ru используя учётную запись ЕСИА (Госуслуги).",
      url: "https://zerno.mcx.gov.ru",
    },
    {
      step: 2,
      title: "Получение ЭЦП (УКЭП)",
      description: "Получите квалифицированную электронную подпись в аккредитованном удостоверяющем центре (ФНС, Контур, и др.).",
      url: "https://www.nalog.gov.ru/rn77/related_activities/ucfns/",
    },
    {
      step: 3,
      title: "Установка КриптоПро CSP",
      description: "Установите криптопровайдер КриптоПро CSP версии 5.0 или выше для подписания документов.",
      url: "https://www.cryptopro.ru/products/csp",
    },
    {
      step: 4,
      title: "Загрузка сертификата в ФГИС",
      description: "В личном кабинете ФГИС «Зерно» загрузите публичный ключ сертификата в разделе «Настройки API».",
      url: "https://specagro.ru/fgis",
    },
    {
      step: 5,
      title: "Тестирование",
      description: "Протестируйте отправку на тестовом контуре test.zerno.mcx.gov.ru перед переходом в продакшн.",
      url: "https://test.zerno.mcx.gov.ru",
    },
    {
      step: 6,
      title: "Ввод настроек в AZAT Platform",
      description: "В разделе Настройки → ФГИС Зерно укажите ИНН, загрузите сертификат и выберите режим (тест/прод).",
      url: "",
    },
  ],
  documentation: [
    { title: "Официальная документация ФГИС «Зерно»", url: "https://specagro.ru/fgis" },
    { title: "FAQ по ФГИС «Зерно»", url: "https://specagro.ru/fgis-faq" },
    { title: "Руководство пользователя (скачать из ЛК)", url: "https://zerno.mcx.gov.ru" },
    { title: "Описание API v1.0.8+", url: "https://specagro.ru/fgis" },
  ],
};
