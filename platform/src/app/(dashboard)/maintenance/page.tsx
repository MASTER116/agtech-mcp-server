"use client";

import { trpc } from "@/lib/trpc";
import { Wrench, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function MaintenancePage() {
  const { data: upcoming } = trpc.maintenance.getUpcoming.useQuery();
  const { data: all } = trpc.maintenance.list.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Обслуживание техники</h1>

      {/* Upcoming Maintenance */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Предстоящее обслуживание
        </h2>
        {!upcoming?.length ? (
          <p className="text-sm text-gray-500">Нет запланированного обслуживания на ближайшие 30 дней</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((record) => {
              const category = EQUIPMENT_CATEGORIES[record.equipment.category as keyof typeof EQUIPMENT_CATEGORIES];
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-amber-50 border border-amber-200"
                >
                  <Wrench className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{record.title}</p>
                    <p className="text-sm text-gray-500">
                      {record.equipment.name} ({category?.label})
                    </p>
                    {record.description && (
                      <p className="text-xs text-gray-400 mt-1">{record.description}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {record.scheduledAt && (
                      <p className="text-amber-600 font-medium">{formatDate(record.scheduledAt)}</p>
                    )}
                    {record.cost && (
                      <p className="text-xs text-gray-400">{record.cost.toLocaleString("ru-RU")} ₽</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Maintenance Records */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">История обслуживания</h2>
        {!all?.length ? (
          <p className="text-sm text-gray-500">Нет записей обслуживания</p>
        ) : (
          <div className="space-y-2">
            {all.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
              >
                {record.completedAt ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{record.title}</p>
                  <p className="text-xs text-gray-500">{record.equipment.name}</p>
                </div>
                <span className="text-xs text-gray-400">
                  {record.completedAt
                    ? formatDate(record.completedAt)
                    : record.scheduledAt
                      ? formatDate(record.scheduledAt)
                      : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
