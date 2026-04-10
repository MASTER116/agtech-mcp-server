"use client";

import { trpc } from "@/lib/trpc";
import { Wifi, WifiOff, RefreshCw, ExternalLink, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const SEVERITY_STYLES = {
  crisis: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  alert: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  watch: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
};

export default function PricesPage() {
  const { data, isLoading, refetch, dataUpdatedAt } = trpc.liveData.getAll.useQuery(undefined, {
    refetchInterval: 5 * 60_000, // Обновлять каждые 5 минут
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Рыночные данные</h1>
          <p className="text-sm text-gray-500 mt-1">Цены, курсы, мировые кризисы — живые данные из открытых источников</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>

      {/* Источники данных */}
      {data && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Источники данных</h2>
            <span className="text-xs text-gray-400">
              Обновлено: {formatDateTime(data.lastUpdated)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.dataSources.map((src) => (
              <a
                key={src.name}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border hover:shadow-sm transition-shadow"
              >
                {src.status === "live" ? (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                ) : src.status === "cached" ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-300" />
                )}
                <span className="text-gray-700">{src.name}</span>
                <span className={`px-1 py-0.5 rounded text-[10px] ${
                  src.status === "live" ? "bg-green-100 text-green-700" :
                  src.status === "cached" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {src.status === "live" ? "LIVE" : src.status === "cached" ? "CACHED" : "OFFLINE"}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Курс и MOEX */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500 mb-1">Курс USD/RUB (ЦБ РФ)</p>
            <p className="text-3xl font-bold text-gray-900">{data.usdRub.toFixed(2)} ₽</p>
            <a href="https://www.cbr-xml-daily.ru/" target="_blank" className="text-xs text-blue-500 flex items-center gap-1 mt-1">
              <ExternalLink className="h-2.5 w-2.5" /> cbr-xml-daily.ru
            </a>
          </div>

          {data.moexWheat && (
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">{data.moexWheat.name} (MOEX)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{data.moexWheat.lastPrice.toLocaleString("ru-RU")}</p>
                <span className="text-sm text-gray-500">₽/т</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {data.moexWheat.changePct > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : data.moexWheat.changePct < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : (
                  <Minus className="h-3 w-3 text-gray-400" />
                )}
                <span className={`text-xs font-medium ${data.moexWheat.changePct > 0 ? "text-green-600" : data.moexWheat.changePct < 0 ? "text-red-600" : "text-gray-500"}`}>
                  {data.moexWheat.changePct > 0 ? "+" : ""}{data.moexWheat.changePct.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-400 ml-2">Объём: {data.moexWheat.volume}</span>
              </div>
              <a href="https://www.moex.com/msn/wheat" target="_blank" className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                <ExternalLink className="h-2.5 w-2.5" /> moex.com
              </a>
            </div>
          )}

          <div className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500 mb-1">Всего культур отслеживается</p>
            <p className="text-3xl font-bold text-gray-900">{data.prices.length}</p>
            <p className="text-xs text-gray-400 mt-1">Обновление: ежечасно</p>
          </div>
        </div>
      )}

      {/* Таблица цен */}
      {data && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Цены на сельхозпродукцию</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Культура</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Цена (₽/т)</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Цена ($/т)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Период</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Источник</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.prices.map((p) => (
                <tr key={p.commodity} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-bold">{p.priceRub.toLocaleString("ru-RU")}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-gray-600">{p.priceUsd > 0 ? `$${p.priceUsd}` : "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{p.monthYear}</td>
                  <td className="px-4 py-2.5">
                    <a href={p.sourceUrl} target="_blank" className="text-xs text-blue-500 flex items-center gap-1 hover:underline">
                      <ExternalLink className="h-2.5 w-2.5" />
                      {p.source === "worldbank" ? "World Bank" : p.source === "fao" ? "FAO" : "IndexMundi"}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FAO Алерты */}
      {data && data.faoAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Мировые продовольственные алерты (FAO GIEWS)
          </h2>
          {data.faoAlerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity];
            return (
              <div key={alert.id} className={`rounded-lg border p-4 ${style.bg} ${style.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                    {alert.severity === "crisis" ? "КРИЗИС" : alert.severity === "alert" ? "АЛЕРТ" : "МОНИТОРИНГ"}
                  </span>
                  <span className="text-xs text-gray-500">{alert.region}</span>
                  <span className="text-xs text-gray-400">{alert.date}</span>
                  {alert.priceImpact === "up" && <TrendingUp className="h-3 w-3 text-green-600" />}
                  {alert.priceImpact === "down" && <TrendingDown className="h-3 w-3 text-red-600" />}
                </div>
                <p className={`font-medium ${style.text}`}>{alert.title}</p>
                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500">Товар: {alert.commodity}</span>
                  <a href={alert.sourceUrl} target="_blank" className="text-xs text-blue-500 flex items-center gap-1">
                    <ExternalLink className="h-2.5 w-2.5" /> Источник FAO
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Обновления субсидий */}
      {data && data.subsidyUpdates.length > 0 && (
        <div className="bg-white rounded-lg border p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Последние обновления субсидий</h2>
          <div className="space-y-2">
            {data.subsidyUpdates.map((upd) => (
              <div key={upd.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{upd.title}</p>
                  <p className="text-xs text-gray-400">{upd.date}</p>
                </div>
                <a href={upd.sourceUrl} target="_blank" className="text-xs text-blue-500 flex items-center gap-1 flex-shrink-0">
                  <ExternalLink className="h-3 w-3" /> mcx.gov.ru
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
