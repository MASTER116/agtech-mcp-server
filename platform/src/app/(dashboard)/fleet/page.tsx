"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Tractor } from "lucide-react";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from "@/lib/constants";
import dynamic from "next/dynamic";

const FleetMap = dynamic(() => import("@/components/maps/fleet-map"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />,
});

export default function FleetPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [view, setView] = useState<"list" | "map">("list");

  const { data: equipment, isLoading } = trpc.fleet.list.useQuery({
    search: search || undefined,
    status: (statusFilter as "ACTIVE" | "IDLE" | "MAINTENANCE" | "DECOMMISSIONED") || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Парк техники</h1>
        <Link
          href="/fleet/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Добавить технику
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Все статусы</option>
          {Object.entries(EQUIPMENT_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-2 text-sm ${view === "list" ? "bg-green-600 text-white" : "bg-white"}`}
          >
            Список
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-3 py-2 text-sm ${view === "map" ? "bg-green-600 text-white" : "bg-white"}`}
          >
            Карта
          </button>
        </div>
      </div>

      {view === "map" && equipment && (
        <FleetMap equipment={equipment} />
      )}

      {view === "list" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Загрузка...</div>
          ) : !equipment?.length ? (
            <div className="p-8 text-center text-gray-500">
              <Tractor className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Техника не найдена</p>
              <Link href="/fleet/new" className="text-green-600 text-sm mt-2 inline-block">
                Добавить первую единицу
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Название</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Тип</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Марка / Модель</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Моточасы</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {equipment.map((eq) => {
                  const status = EQUIPMENT_STATUSES[eq.status as keyof typeof EQUIPMENT_STATUSES];
                  const category = EQUIPMENT_CATEGORIES[eq.category as keyof typeof EQUIPMENT_CATEGORIES];
                  return (
                    <tr key={eq.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/fleet/${eq.id}`} className="font-medium text-green-600 hover:text-green-700">
                          {eq.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{category?.label}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {[eq.make, eq.model].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: status?.color + "20", color: status?.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status?.color }} />
                          {status?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{eq.engineHours ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
