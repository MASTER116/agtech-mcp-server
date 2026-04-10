"use client";

import { trpc } from "@/lib/trpc";
import { Wheat, Plus, ExternalLink, Settings, AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useState } from "react";
import { FGIS_SETUP_GUIDE, CROP_OKPD2 } from "@/server/integrations/fgis-zerno";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Черновик", color: "#6b7280" },
  submitted: { label: "Отправлено в ФГИС", color: "#3b82f6" },
  registered: { label: "Зарегистрировано", color: "#22c55e" },
  sold: { label: "Продано", color: "#8b5cf6" },
};

export default function GrainPage() {
  const currentYear = new Date().getFullYear();
  const { data: lots, refetch } = trpc.integrations.listGrainLots.useQuery({ year: currentYear });
  const createLot = trpc.integrations.createGrainLot.useMutation({ onSuccess: () => { refetch(); setShowForm(false); } });
  const registerLot = trpc.integrations.registerGrainLot.useMutation({ onSuccess: () => refetch() });

  const [showForm, setShowForm] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [fgisConfigured, setFgisConfigured] = useState(false);

  const totalWeight = lots?.reduce((s: number, l: any) => s + l.weightKg, 0) || 0;
  const totalSold = lots?.filter((l: any) => l.fgisStatus === "sold").reduce((s: number, l: any) => s + (l.salePrice || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">ФГИС «Зерно»</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSetup(!showSetup)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700"
          >
            <Settings className="h-4 w-4" /> Настройка
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Добавить партию
          </button>
        </div>
      </div>

      {/* Предупреждение если не настроен */}
      {!fgisConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">ФГИС «Зерно» не настроен</p>
            <p className="text-xs text-amber-700 mt-1">Партии сохраняются локально. Для отправки в ФГИС настройте ЭЦП и подключение к API.</p>
            <button onClick={() => setShowSetup(true)} className="text-xs text-amber-800 underline mt-1">Показать инструкцию →</button>
          </div>
        </div>
      )}

      {/* Инструкция по настройке */}
      {showSetup && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">{FGIS_SETUP_GUIDE.title}</h2>

          <div className="space-y-3">
            {FGIS_SETUP_GUIDE.steps.map((step) => (
              <div key={step.step} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                  {step.url && (
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                      <ExternalLink className="h-2.5 w-2.5" /> {step.url}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Документация:</p>
            <div className="flex flex-wrap gap-2">
              {FGIS_SETUP_GUIDE.documentation.map((doc) => (
                <a key={doc.title} href={doc.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> {doc.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Сводка */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Всего зерна ({currentYear})</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{(totalWeight / 1000).toFixed(1)} т</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Партий</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{lots?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Выручка от продаж</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{totalSold.toLocaleString("ru-RU")} ₽</p>
        </div>
      </div>

      {/* Форма добавления партии */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Новая партия зерна</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createLot.mutate({
                cropName: fd.get("cropName") as string,
                harvestYear: Number(fd.get("harvestYear")),
                weightKg: Number(fd.get("weightKg")),
                qualityClass: (fd.get("qualityClass") as string) || undefined,
                moisture: fd.get("moisture") ? Number(fd.get("moisture")) : undefined,
                notes: (fd.get("notes") as string) || undefined,
              });
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Культура *</label>
              <select name="cropName" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                {Object.entries(CROP_OKPD2).map(([name, info]) => (
                  <option key={name} value={name}>{name} (ОКПД2: {info.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Масса, кг *</label>
              <input name="weightKg" type="number" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="50000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Год урожая *</label>
              <input name="harvestYear" type="number" required defaultValue={currentYear} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Класс</label>
              <select name="qualityClass" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
                <option value="">—</option>
                <option value="1">1 класс</option>
                <option value="2">2 класс</option>
                <option value="3">3 класс</option>
                <option value="4">4 класс</option>
                <option value="5">5 класс (фуражная)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Влажность, %</label>
              <input name="moisture" type="number" step="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="14.0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Примечание</label>
              <input name="notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div className="md:col-span-3 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Отмена</button>
              <button type="submit" disabled={createLot.isPending} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
                {createLot.isPending ? "Сохранение..." : "Сохранить партию"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Таблица партий */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {!lots?.length ? (
          <div className="p-8 text-center text-gray-500">
            <Wheat className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Нет партий зерна</p>
            <p className="text-sm mt-2 text-gray-400">Добавьте партию для учёта и подготовки к отправке в ФГИС</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Культура</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Масса, т</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Класс</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Влажн.</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">СДИЗ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lots.map((lot: any) => {
                const status = STATUS_MAP[lot.fgisStatus] || STATUS_MAP.draft;
                return (
                  <tr key={lot.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{lot.cropName}</td>
                    <td className="px-4 py-3 text-sm">{(lot.weightKg / 1000).toFixed(1)}</td>
                    <td className="px-4 py-3 text-sm">{lot.qualityClass || "—"}</td>
                    <td className="px-4 py-3 text-sm">{lot.moisture ? `${lot.moisture}%` : "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono text-xs">{lot.sdizNumber || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: status.color + "20", color: status.color }}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {lot.fgisStatus === "draft" && (
                        <button
                          onClick={() => registerLot.mutate({ id: lot.id })}
                          disabled={registerLot.isPending}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          title={fgisConfigured ? "Отправить в ФГИС «Зерно»" : "Имитация (ФГИС не настроен)"}
                        >
                          <Send className="h-3 w-3" />
                          {fgisConfigured ? "Отправить в ФГИС" : "Сформировать СДИЗ"}
                        </button>
                      )}
                      {lot.fgisStatus === "submitted" && (
                        <span className="text-xs text-gray-400">Ожидание ответа</span>
                      )}
                      {lot.fgisStatus === "registered" && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
