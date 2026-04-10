"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Fuel as FuelIcon, Plus, FileText, TrendingDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function FuelPage() {
  const [tab, setTab] = useState<"records" | "waybills" | "summary">("records");
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const { data: records } = trpc.fuel.list.useQuery({ from: thirtyDaysAgo });
  const { data: waybills } = trpc.fuel.waybills.useQuery();
  const { data: summary } = trpc.fuel.summary.useQuery({ from: thirtyDaysAgo, to: new Date() });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Учёт ГСМ</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Записать заправку
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Заправлено (30 дней)</p>
            <p className="text-2xl font-bold mt-1">{summary.refueled.toLocaleString("ru-RU")} л</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Израсходовано</p>
            <p className="text-2xl font-bold mt-1">{summary.consumed.toLocaleString("ru-RU")} л</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Затраты на ГСМ</p>
            <p className="text-2xl font-bold mt-1">{summary.totalCost.toLocaleString("ru-RU")} ₽</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Записей</p>
            <p className="text-2xl font-bold mt-1">{summary.recordCount}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { key: "records", label: "Записи ГСМ", icon: FuelIcon },
          { key: "waybills", label: "Путевые листы", icon: FileText },
          { key: "summary", label: "Аналитика", icon: TrendingDown },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === key ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "records" && (
        <div className="bg-white rounded-lg border overflow-hidden">
          {!records?.length ? (
            <div className="p-8 text-center text-gray-500">Нет записей ГСМ</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Дата</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Тип</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Литры</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Стоимость</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Моточасы</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{formatDate(r.recordedAt)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${r.type === "refuel" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.type === "refuel" ? "Заправка" : "Расход"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{r.liters} л</td>
                    <td className="px-4 py-3 text-sm">{r.totalCost ? `${r.totalCost.toLocaleString("ru-RU")} ₽` : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{r.engineHours ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "waybills" && (
        <div className="bg-white rounded-lg border overflow-hidden">
          {!waybills?.length ? (
            <div className="p-8 text-center text-gray-500">Нет путевых листов</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Номер</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Дата</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Маршрут</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Пробег, км</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ГСМ факт/норма</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {waybills.map((w: any) => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{w.number}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(w.date)}</td>
                    <td className="px-4 py-3 text-sm">{[w.routeFrom, w.routeTo].filter(Boolean).join(" → ") || "—"}</td>
                    <td className="px-4 py-3 text-sm">{w.distanceKm ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">{w.fuelConsumed ?? "—"} / {w.fuelNorm ?? "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs ${w.status === "closed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {w.status === "closed" ? "Закрыт" : "Открыт"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
