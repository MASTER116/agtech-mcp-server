"use client";

import { trpc } from "@/lib/trpc";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, MapPin, Tractor, User, Package } from "lucide-react";
import Link from "next/link";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: activity, isLoading } = trpc.activities.getById.useQuery({ id });
  const updateStatus = trpc.activities.updateStatus.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-64" /><div className="h-40 bg-gray-200 rounded" /></div>;
  }

  if (!activity) {
    return <div className="text-center py-12 text-gray-500">Задача не найдена</div>;
  }

  const type = ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES];
  const status = ACTIVITY_STATUSES[activity.status as keyof typeof ACTIVITY_STATUSES];

  const nextStatuses: Record<string, string[]> = {
    PLANNED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
    OVERDUE: ["IN_PROGRESS", "CANCELLED"],
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/activities" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{activity.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: type?.color + "20", color: type?.color }}>
              {type?.label}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: status?.color + "20", color: status?.color }}>
              {status?.label}
            </span>
          </div>
        </div>
      </div>

      {/* Действия */}
      {nextStatuses[activity.status]?.length > 0 && (
        <div className="flex gap-2">
          {nextStatuses[activity.status].map((s) => {
            const st = ACTIVITY_STATUSES[s as keyof typeof ACTIVITY_STATUSES];
            return (
              <button
                key={s}
                onClick={() => updateStatus.mutate({ id, status: s as any })}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: st?.color }}
                disabled={updateStatus.isPending}
              >
                {s === "IN_PROGRESS" ? "Начать" : s === "COMPLETED" ? "Завершить" : "Отменить"}
              </button>
            );
          })}
        </div>
      )}

      {/* Детали */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        {activity.description && (
          <div>
            <p className="text-sm text-gray-500">Описание</p>
            <p className="mt-1">{activity.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Период</p>
              <p className="text-sm">{formatDate(activity.plannedStartAt)} — {formatDate(activity.plannedEndAt)}</p>
              {activity.actualStartAt && (
                <p className="text-xs text-green-600">Факт: {formatDate(activity.actualStartAt)} — {activity.actualEndAt ? formatDate(activity.actualEndAt) : "..."}</p>
              )}
            </div>
          </div>

          {activity.field && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Поле</p>
                <Link href={`/fields/${activity.field.id}`} className="text-sm text-green-600 hover:underline">{activity.field.name}</Link>
              </div>
            </div>
          )}

          {activity.assignedTo && (
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Оператор</p>
                <p className="text-sm">{activity.assignedTo.name}</p>
              </div>
            </div>
          )}

          {activity.inputProduct && (
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Препарат / Материал</p>
                <p className="text-sm">{activity.inputProduct}</p>
                {activity.inputRateKgHa && <p className="text-xs text-gray-400">{activity.inputRateKgHa} кг/га</p>}
              </div>
            </div>
          )}
        </div>

        {/* Техника */}
        {activity.equipment.length > 0 && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Техника</p>
            <div className="flex flex-wrap gap-2">
              {activity.equipment.map((ae: any) => (
                <Link
                  key={ae.equipment.id}
                  href={`/fleet/${ae.equipment.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                >
                  <Tractor className="h-3 w-3" />
                  {ae.equipment.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Затраты */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500">Плановые затраты</p>
            <p className="text-lg font-bold">{activity.estimatedCost ? `${activity.estimatedCost.toLocaleString("ru-RU")} ₽` : "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Фактические затраты</p>
            <p className="text-lg font-bold">{activity.actualCost ? `${activity.actualCost.toLocaleString("ru-RU")} ₽` : "—"}</p>
          </div>
        </div>

        {/* Погодные ограничения */}
        {(activity.weatherMinTemp || activity.weatherMaxWind) && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">Погодные ограничения</p>
            <div className="flex gap-4 text-sm">
              {activity.weatherMinTemp && <span>Мин. температура: {activity.weatherMinTemp}°C</span>}
              {activity.weatherMaxWind && <span>Макс. ветер: {activity.weatherMaxWind} м/с</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
