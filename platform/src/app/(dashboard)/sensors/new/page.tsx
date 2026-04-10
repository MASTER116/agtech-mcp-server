"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SENSOR_TYPES } from "@/lib/constants";

export default function NewSensorPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const registerSensor = trpc.sensors.register.useMutation({
    onSuccess: () => { router.push("/sensors"); router.refresh(); },
    onError: (err) => setError(err.message),
  });

  const { data: fields } = trpc.fields.list.useQuery();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    registerSensor.mutate({
      deviceId: fd.get("deviceId") as string,
      name: fd.get("name") as string,
      type: fd.get("type") as "SOIL_MOISTURE",
      unit: fd.get("unit") as string,
      fieldId: (fd.get("fieldId") as string) || undefined,
      latitude: fd.get("latitude") ? Number(fd.get("latitude")) : undefined,
      longitude: fd.get("longitude") ? Number(fd.get("longitude")) : undefined,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/sensors" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Добавить датчик</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device ID *</label>
            <input name="deviceId" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="SM-001" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="Влажность почвы (Поле 1)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип датчика *</label>
            <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
              {Object.entries(SENSOR_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label} ({val.unit})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Единица измерения *</label>
            <input name="unit" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="%, °C, мм" defaultValue="%" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поле</label>
            <select name="fieldId" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
              <option value="">— Не привязан —</option>
              {fields?.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Широта</label>
            <input name="latitude" type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="45.35" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Долгота</label>
            <input name="longitude" type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="40.22" />
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="font-medium">Как подключить датчик:</p>
          <p className="mt-1">После регистрации отправляйте данные на <code className="bg-blue-100 px-1 rounded">POST /api/sensors/ingest</code> с API-ключом организации (Настройки → API-ключ).</p>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/sensors" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Отмена</Link>
          <button type="submit" disabled={registerSensor.isPending} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
            {registerSensor.isPending ? "Регистрация..." : "Зарегистрировать"}
          </button>
        </div>
      </form>
    </div>
  );
}
