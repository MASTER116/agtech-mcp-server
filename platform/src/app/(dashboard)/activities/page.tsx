"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function ActivitiesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data: activities, isLoading } = trpc.activities.list.useQuery({
    status: (statusFilter as "PLANNED") || undefined,
    type: (typeFilter as "PLOWING") || undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Планирование работ</h1>
        <Link
          href="/activities/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Новая задача
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Все статусы</option>
          {Object.entries(ACTIVITY_STATUSES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Все типы</option>
          {Object.entries(ACTIVITY_TYPES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : !activities?.length ? (
          <div className="p-8 text-center text-gray-500">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Задачи не найдены</p>
          </div>
        ) : (
          <div className="divide-y">
            {activities.map((activity) => {
              const type = ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES];
              const status = ACTIVITY_STATUSES[activity.status as keyof typeof ACTIVITY_STATUSES];
              return (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: type?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                      <span>{type?.label}</span>
                      {activity.field && <span>{activity.field.name}</span>}
                      {activity.assignedTo && <span>{activity.assignedTo.name}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className="inline-flex px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: status?.color + "20", color: status?.color }}
                    >
                      {status?.label}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.plannedStartAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {activity.equipment.length > 0 && (
                      <span>{activity.equipment.length} ед. техники</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
