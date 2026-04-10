"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Map, PenLine } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FieldDrawMap = dynamic(() => import("@/components/maps/field-draw-map"), {
  ssr: false,
  loading: () => <div className="h-[500px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center text-gray-400">Загрузка карты...</div>,
});

interface DrawnField {
  boundary: { type: string; coordinates: number[][][] };
  centerLat: number;
  centerLon: number;
  areaHa: number;
}

export default function NewFieldPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"map" | "manual">("map");
  const [drawnField, setDrawnField] = useState<DrawnField | null>(null);
  const [name, setName] = useState("");
  const [soilType, setSoilType] = useState("");
  const [notes, setNotes] = useState("");

  // Для ручного ввода
  const [manualArea, setManualArea] = useState("");
  const [manualLat, setManualLat] = useState("45.35");
  const [manualLon, setManualLon] = useState("40.22");

  const { data: existingFields } = trpc.fields.list.useQuery();

  const createField = trpc.fields.create.useMutation({
    onSuccess: () => { router.push("/fields"); router.refresh(); },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (mode === "map" && drawnField) {
      createField.mutate({
        name,
        areaHa: drawnField.areaHa,
        centerLat: drawnField.centerLat,
        centerLon: drawnField.centerLon,
        boundary: drawnField.boundary,
        soilType: soilType || undefined,
        notes: notes || undefined,
      });
    } else {
      const lat = Number(manualLat);
      const lon = Number(manualLon);
      const areaHa = Number(manualArea);
      const side = Math.sqrt(areaHa * 10000) / 111000;
      const boundary = {
        type: "Polygon",
        coordinates: [[[lon - side/2, lat - side/2], [lon + side/2, lat - side/2], [lon + side/2, lat + side/2], [lon - side/2, lat + side/2], [lon - side/2, lat - side/2]]],
      };
      createField.mutate({
        name,
        areaHa,
        centerLat: lat,
        centerLon: lon,
        boundary,
        soilType: soilType || undefined,
        notes: notes || undefined,
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fields" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Добавить поле</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {/* Переключатель режимов */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("map")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${mode === "map" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
        >
          <Map className="h-4 w-4" /> Нарисовать на карте
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${mode === "manual" ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}
        >
          <PenLine className="h-4 w-4" /> Ввести вручную
        </button>
      </div>

      {/* Карта */}
      {mode === "map" && (
        <FieldDrawMap
          existingFields={existingFields || []}
          onFieldDrawn={(field) => {
            setDrawnField(field);
            if (!name) setName(`Поле №${(existingFields?.length || 0) + 5}`);
          }}
        />
      )}

      {/* Данные нарисованного поля */}
      {mode === "map" && drawnField && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">Участок выделен на карте</p>
          <div className="flex gap-6 mt-2 text-sm text-green-700">
            <span>Площадь: <strong>{drawnField.areaHa} га</strong></span>
            <span>Центр: {drawnField.centerLat}, {drawnField.centerLon}</span>
            <span>Вершин: {drawnField.boundary.coordinates[0].length - 1}</span>
          </div>
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              placeholder="Поле №5 — Южное"
            />
          </div>

          {mode === "map" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Площадь (авто)</label>
              <input
                value={drawnField ? `${drawnField.areaHa} га` : "Нарисуйте участок на карте"}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-500 bg-gray-50"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Площадь, га *</label>
                <input
                  value={manualArea}
                  onChange={(e) => setManualArea(e.target.value)}
                  type="number" step="0.1" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Широта центра *</label>
                <input
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  type="number" step="any" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Долгота центра *</label>
                <input
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  type="number" step="any" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип почвы</label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="">— Не указан —</option>
              <option>Чернозём обыкновенный</option>
              <option>Чернозём выщелоченный</option>
              <option>Чернозём типичный</option>
              <option>Серая лесная</option>
              <option>Дерново-подзолистая</option>
              <option>Каштановая</option>
              <option>Аллювиальная</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/fields" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Отмена</Link>
          <button
            type="submit"
            disabled={createField.isPending || (mode === "map" && !drawnField)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            {createField.isPending ? "Сохранение..." : "Добавить поле"}
          </button>
        </div>
      </form>
    </div>
  );
}
