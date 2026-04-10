"use client";

import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";
import { ArrowLeft, Wrench, MapPin, Clock, Fuel } from "lucide-react";
import Link from "next/link";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function EquipmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: eq, isLoading } = trpc.fleet.getById.useQuery({ id });

  if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;
  if (!eq) return <div className="text-center py-12 text-gray-500">Техника не найдена</div>;

  const category = EQUIPMENT_CATEGORIES[eq.category as keyof typeof EQUIPMENT_CATEGORIES];
  const status = EQUIPMENT_STATUSES[eq.status as keyof typeof EQUIPMENT_STATUSES];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fleet" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">{eq.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{category?.label}</span>
            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: status?.color + "20", color: status?.color }}>
              {status?.label}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-sm text-gray-500">Производитель</p><p className="font-medium">{eq.make || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Модель</p><p className="font-medium">{eq.model || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Год</p><p className="font-medium">{eq.year || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Топливо</p><p className="font-medium">{eq.fuelType || "—"}</p></div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div><p className="text-sm text-gray-500">Моточасы</p><p className="font-medium">{eq.engineHours ?? "—"}</p></div>
          </div>
          <div><p className="text-sm text-gray-500">Серийный №</p><p className="font-medium text-xs">{eq.serialNumber || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Рег. №</p><p className="font-medium">{eq.registrationNo || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Стоимость</p><p className="font-medium">{eq.purchasePrice ? `${eq.purchasePrice.toLocaleString("ru-RU")} ₽` : "—"}</p></div>
        </div>
        {eq.notes && <p className="mt-4 text-sm text-gray-600 border-t pt-4">{eq.notes}</p>}
      </div>

      {/* Последние ТО */}
      {eq.maintenance.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Wrench className="h-5 w-5" /> Последнее обслуживание</h2>
          <div className="space-y-2">
            {eq.maintenance.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-gray-500">{m.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{m.completedAt ? formatDate(m.completedAt) : m.scheduledAt ? formatDate(m.scheduledAt) : "—"}</p>
                  {m.cost && <p className="text-xs text-gray-400">{m.cost.toLocaleString("ru-RU")} ₽</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Последние задачи */}
      {eq.activities.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-3">Последние задачи</h2>
          <div className="space-y-2">
            {eq.activities.map((ae: any) => (
              <Link key={ae.activity.id} href={`/activities/${ae.activity.id}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <p className="text-sm font-medium">{ae.activity.title}</p>
                <p className="text-xs text-gray-400">{formatDate(ae.activity.plannedStartAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
