import { router, orgProcedure, publicProcedure } from "../trpc";
import { getAllLiveData, getWorldBankPrices, getMoexGrainPrice, getCBRRate, getFAOAlerts, getMcxSubsidyUpdates } from "@/server/mcp/live-data";

export const liveDataRouter = router({
  /** Все живые данные одним запросом */
  getAll: orgProcedure.query(async () => {
    return getAllLiveData();
  }),

  /** Только цены */
  getPrices: publicProcedure.query(async () => {
    return getWorldBankPrices();
  }),

  /** Фьючерс пшеницы с MOEX */
  getMoexWheat: publicProcedure.query(async () => {
    return getMoexGrainPrice("wheat");
  }),

  /** Курс USD/RUB с ЦБ РФ */
  getUsdRate: publicProcedure.query(async () => {
    return getCBRRate();
  }),

  /** Продовольственные кризисы FAO */
  getFaoAlerts: publicProcedure.query(async () => {
    return getFAOAlerts();
  }),

  /** Обновления субсидий */
  getSubsidyUpdates: publicProcedure.query(async () => {
    return getMcxSubsidyUpdates();
  }),
});
