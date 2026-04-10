"use client";

import { useState } from "react";
import { Sprout, Droplets, Bug, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AgronomyPage() {
  const [tab, setTab] = useState<"spray" | "rotation" | "pesticide" | "quality">("spray");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Агрономия</h1>

      <div className="flex gap-2 border-b">
        {[
          { key: "spray", label: "Окно опрыскивания", icon: Droplets },
          { key: "rotation", label: "Севооборот", icon: RotateCcw },
          { key: "pesticide", label: "Журнал СЗР", icon: Bug },
          { key: "quality", label: "Качество урожая", icon: Sprout },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === key ? "border-green-600 text-green-600" : "border-transparent text-gray-500"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "spray" && <SprayTab />}
      {tab === "rotation" && <RotationTab />}
      {tab === "pesticide" && <PesticideTab />}
      {tab === "quality" && <QualityTab />}
    </div>
  );
}

function SprayTab() {
  const [conditions, setConditions] = useState({ temperature: 18, windSpeed: 3, humidity: 65, precipitationMm: 0, hour: 7 });
  const { data: result } = trpc.agronomy.evaluateSprayWindow.useQuery(conditions);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Параметры</h2>
        <div className="space-y-3">
          {[
            { key: "temperature", label: "Температура, °C", min: -10, max: 45 },
            { key: "windSpeed", label: "Ветер, м/с", min: 0, max: 20 },
            { key: "humidity", label: "Влажность, %", min: 10, max: 100 },
            { key: "precipitationMm", label: "Осадки (4ч), мм", min: 0, max: 30 },
            { key: "hour", label: "Час (0-23)", min: 0, max: 23 },
          ].map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}: {conditions[key as keyof typeof conditions]}</label>
              <input
                type="range" min={min} max={max} step={key === "precipitationMm" ? 0.5 : 1}
                value={conditions[key as keyof typeof conditions]}
                onChange={(e) => setConditions({ ...conditions, [key]: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg border p-6">
          <div className={`text-center p-6 rounded-lg mb-4 ${result.color === "green" ? "bg-green-50" : result.color === "yellow" ? "bg-amber-50" : "bg-red-50"}`}>
            <p className="text-5xl font-bold" style={{ color: result.color === "green" ? "#22c55e" : result.color === "yellow" ? "#f59e0b" : "#ef4444" }}>
              {result.score}
            </p>
            <p className="text-lg font-medium mt-2">
              {result.canSpray ? "Можно опрыскивать" : "Опрыскивание не рекомендуется"}
            </p>
          </div>

          {Object.entries(result.factors).map(([key, factor]: [string, any]) => (
            <div key={key} className="flex items-center gap-3 py-2 border-b last:border-0">
              <span className={`w-2 h-2 rounded-full ${factor.status === "ok" ? "bg-green-500" : factor.status === "warning" ? "bg-amber-500" : "bg-red-500"}`} />
              <span className="text-sm">{factor.label}</span>
            </div>
          ))}

          {result.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-red-700 mb-1">Предупреждения:</p>
              {result.warnings.map((w, i) => <p key={i} className="text-xs text-red-600">- {w}</p>)}
            </div>
          )}
          {result.recommendations.length > 0 && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-700 mb-1">Рекомендации:</p>
              {result.recommendations.map((r, i) => <p key={i} className="text-xs text-blue-600">- {r}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RotationTab() {
  const { data: fields } = trpc.fields.list.useQuery();

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Севооборот по полям</h2>
      {fields?.map((field: any) => (
        <FieldRotation key={field.id} fieldId={field.id} fieldName={field.name} />
      ))}
      {!fields?.length && <p className="text-gray-500">Добавьте поля для планирования севооборота</p>}
    </div>
  );
}

function FieldRotation({ fieldId, fieldName }: { fieldId: string; fieldName: string }) {
  const { data: suggestions } = trpc.agronomy.suggestCrops.useQuery({ fieldId });
  const { data: plan } = trpc.agronomy.getRotationPlan.useQuery({ fieldId });

  return (
    <div className="mb-6 pb-6 border-b last:border-0">
      <h3 className="font-medium mb-2">{fieldName}</h3>
      {plan && plan.length > 0 && (
        <div className="flex gap-2 mb-3">
          {plan.slice(0, 5).map((p: any) => (
            <span key={p.id} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              {p.year}: {p.cropName}
            </span>
          ))}
        </div>
      )}
      {suggestions && suggestions.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">Рекомендации на следующий год:</p>
          {suggestions.slice(0, 5).map((s: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 rounded-full h-2" style={{ width: `${s.rating}%` }} />
              </div>
              <span className="text-sm font-medium w-40">{s.crop}</span>
              <span className="text-xs text-gray-500">{s.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PesticideTab() {
  const { data: journal } = trpc.agronomy.getPesticideJournal.useQuery();

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Журнал применения СЗР</h2>
        <p className="text-sm text-gray-500">Обязательный документ для Россельхознадзора</p>
      </div>
      {!journal?.length ? (
        <div className="p-8 text-center text-gray-500">Нет записей</div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Дата</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Препарат</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Норма</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Площадь</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Цель</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ожидание</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {journal.map((r: any) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{formatDateShort(r.date)}</td>
                <td className="px-4 py-2 text-sm font-medium">{r.productName}</td>
                <td className="px-4 py-2 text-sm">{r.applicationRate} л/га</td>
                <td className="px-4 py-2 text-sm">{r.areaHa} га</td>
                <td className="px-4 py-2 text-sm text-gray-500">{r.targetPest || "—"}</td>
                <td className="px-4 py-2 text-sm">{r.waitingPeriod ? `${r.waitingPeriod} дн.` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function QualityTab() {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold mb-4">Качество урожая</h2>
      <p className="text-gray-500">Добавьте результаты лабораторных анализов зерна для определения класса и цены реализации.</p>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {["Влажность, %", "Засорённость, %", "Клейковина, %", "Натура, г/л", "Протеин, %", "Масличность, %", "Число падения, с", "Класс"].map((label) => (
          <div key={label} className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-bold text-gray-300 mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDateShort(d: string | Date) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
