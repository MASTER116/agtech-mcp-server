"use client";

import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";
import { ArrowLeft, Sprout, Activity, CalendarDays } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function FieldDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: field, isLoading } = trpc.fields.getById.useQuery({ id });

  if (isLoading) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;
  if (!field) return <div className="text-center py-12 text-gray-500">Поле не найдено</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fields" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold">{field.name}</h1>
          <p className="text-sm text-gray-500">{field.areaHa} га | {field.soilType || "Тип почвы не указан"}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">Площадь</p><p className="text-2xl font-bold">{field.areaHa} га</p></div>
          <div><p className="text-sm text-gray-500">Тип почвы</p><p className="font-medium">{field.soilType || "—"}</p></div>
          <div><p className="text-sm text-gray-500">Координаты центра</p><p className="text-sm font-mono">{field.centerLat.toFixed(4)}, {field.centerLon.toFixed(4)}</p></div>
          <div><p className="text-sm text-gray-500">Датчиков</p><p className="font-medium">{field.sensors.length}</p></div>
        </div>
        {field.notes && <p className="mt-4 text-sm text-gray-600 border-t pt-4">{field.notes}</p>}
      </div>

      {/* История культур */}
      {field.cropSeasons.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Sprout className="h-5 w-5 text-green-600" /> История культур</h2>
          <div className="space-y-3">
            {field.cropSeasons.map((cs: any) => (
              <div key={cs.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium">{cs.cropName} {cs.variety ? `(${cs.variety})` : ""}</p>
                  <p className="text-sm text-gray-500">
                    {cs.plantedAt ? `Посев: ${formatDate(cs.plantedAt)}` : ""}
                    {cs.harvestedAt ? ` | Уборка: ${formatDate(cs.harvestedAt)}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">{cs.seasonYear}</p>
                  {cs.yieldKgHa && <p className="text-sm text-green-600">{(cs.yieldKgHa / 100).toFixed(1)} ц/га</p>}
                  {!cs.yieldKgHa && cs.expectedYieldKgHa && <p className="text-sm text-gray-400">Ожид. {(cs.expectedYieldKgHa / 100).toFixed(1)} ц/га</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Задачи на поле */}
      {field.activities.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Задачи на поле</h2>
          <div className="space-y-2">
            {field.activities.map((a: any) => (
              <Link key={a.id} href={`/activities/${a.id}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-gray-400">{formatDate(a.plannedStartAt)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
