"use client";

import { trpc } from "@/lib/trpc";
import { DollarSign, TrendingUp, TrendingDown, Plus, Save, Zap } from "lucide-react";
import { TYPICAL_COSTS_PER_HA, CROP_PRICES_PER_TON, generateSeasonBudget } from "@/lib/cost-calculator";
import { useState, useMemo } from "react";

const BUDGET_CATEGORIES: Record<string, string> = {
  seeds: "Семена", fertilizer: "Удобрения", pesticide: "СЗР",
  fuel: "ГСМ", labor: "Зарплата", maintenance: "ТО и ремонт",
  depreciation: "Амортизация", rent: "Аренда", other: "Прочее",
};

export default function BudgetPage() {
  const currentYear = new Date().getFullYear();
  const { data: budget, refetch } = trpc.integrations.getBudget.useQuery({ year: currentYear });
  const { data: fields } = trpc.fields.list.useQuery();
  const setBudgetLine = trpc.integrations.setBudgetLine.useMutation({ onSuccess: () => refetch() });
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editPlanned, setEditPlanned] = useState("");
  const [editActual, setEditActual] = useState("");
  const [showAutoCalc, setShowAutoCalc] = useState(false);

  const totalPlanned = budget?.reduce((s: number, b: any) => s + b.planned, 0) || 0;
  const totalActual = budget?.reduce((s: number, b: any) => s + b.actual, 0) || 0;

  // Автоматический расчёт бюджета на основе полей и культур
  const autoCalc = useMemo(() => {
    if (!fields?.length) return null;
    const fieldData = fields.map((f: any) => ({
      id: f.id,
      name: f.name,
      areaHa: f.areaHa,
      crop: f.cropSeasons?.[0]?.cropName || "Пшеница озимая",
    }));
    return generateSeasonBudget(fieldData);
  }, [fields]);

  function handleSave(category: string) {
    setBudgetLine.mutate({
      year: currentYear,
      category,
      planned: Number(editPlanned) || 0,
      actual: Number(editActual) || 0,
    });
    setEditingCategory(null);
  }

  function handleAutoFill() {
    if (!autoCalc) return;
    const categories = Object.keys(BUDGET_CATEGORIES);
    const totalByCategory: Record<string, number> = {};

    autoCalc.byField.forEach((f) => {
      Object.entries(f.budget).forEach(([key, val]) => {
        if (key === "total") return;
        totalByCategory[key] = (totalByCategory[key] || 0) + val * f.areaHa;
      });
    });

    // Сохраняем каждую категорию
    categories.forEach((cat) => {
      if (totalByCategory[cat]) {
        setBudgetLine.mutate({
          year: currentYear,
          category: cat,
          planned: Math.round(totalByCategory[cat]),
          actual: 0,
        });
      }
    });
    setShowAutoCalc(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Бюджет сезона {currentYear}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAutoCalc(!showAutoCalc)}
            className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 text-sm font-medium"
          >
            <Zap className="h-4 w-4" /> Авторасчёт
          </button>
        </div>
      </div>

      {/* Авторасчёт */}
      {showAutoCalc && autoCalc && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-green-800">Автоматический расчёт бюджета</h2>
              <p className="text-sm text-green-600 mt-1">
                На основе {autoCalc.byField.length} полей ({autoCalc.totalArea} га) и типовых затрат по культурам
              </p>
            </div>
            <button
              onClick={handleAutoFill}
              disabled={setBudgetLine.isPending}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {setBudgetLine.isPending ? "Сохранение..." : "Заполнить бюджет"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {autoCalc.byField.map((f) => (
              <div key={f.fieldId} className="bg-white rounded-lg p-3 border border-green-100">
                <p className="font-medium text-sm text-gray-900">{f.fieldName}</p>
                <p className="text-xs text-gray-500">{f.crop} — {f.areaHa} га</p>
                <p className="text-sm font-bold text-green-700 mt-1">
                  {(f.budget.total * f.areaHa).toLocaleString("ru-RU")} ₽
                  <span className="font-normal text-xs text-gray-400 ml-1">({f.budget.total.toLocaleString("ru-RU")} ₽/га)</span>
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-green-200">
            <span className="text-sm text-green-700">Итого по всем полям:</span>
            <span className="text-lg font-bold text-green-800">{autoCalc.total.total.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      )}

      {/* Сводка */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">План</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{totalPlanned.toLocaleString("ru-RU")} ₽</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Факт</p>
          <p className="text-2xl font-bold mt-1">{totalActual.toLocaleString("ru-RU")} ₽</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Отклонение</p>
          <div className="flex items-center gap-2 mt-1">
            {totalActual > totalPlanned ? <TrendingUp className="h-5 w-5 text-red-500" /> : <TrendingDown className="h-5 w-5 text-green-500" />}
            <p className={`text-2xl font-bold ${totalActual > totalPlanned ? "text-red-600" : "text-green-600"}`}>
              {Math.abs(totalActual - totalPlanned).toLocaleString("ru-RU")} ₽
            </p>
          </div>
        </div>
      </div>

      {/* Бюджет по категориям — с редактированием */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Расходы по категориям</h2>
        <div className="space-y-3">
          {Object.entries(BUDGET_CATEGORIES).map(([key, label]) => {
            const line = budget?.find((b: any) => b.category === key && !b.fieldId);
            const planned = line?.planned || 0;
            const actual = line?.actual || 0;
            const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
            const isEditing = editingCategory === key;

            return (
              <div key={key} className="border-b border-gray-100 pb-3 last:border-0">
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32">{label}</span>
                    <div className="flex-1 flex gap-2">
                      <div>
                        <label className="text-xs text-gray-400">План, ₽</label>
                        <input
                          type="number"
                          value={editPlanned}
                          onChange={(e) => setEditPlanned(e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Факт, ₽</label>
                        <input
                          type="number"
                          value={editActual}
                          onChange={(e) => setEditActual(e.target.value)}
                          className="w-full px-2 py-1 border rounded text-sm text-gray-900"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <button onClick={() => handleSave(key)} className="p-2 bg-green-600 text-white rounded hover:bg-green-700">
                      <Save className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="p-2 border rounded hover:bg-gray-50 text-gray-500 text-sm">
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingCategory(key); setEditPlanned(String(planned)); setEditActual(String(actual)); }}
                    className="w-full text-left hover:bg-gray-50 rounded p-1 -m-1"
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{label}</span>
                      <span className={`${pct > 100 ? "text-red-600 font-medium" : "text-gray-600"}`}>
                        {actual.toLocaleString("ru-RU")} / {planned.toLocaleString("ru-RU")} ₽ ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-4">Нажмите на категорию для редактирования плана и факта</p>
      </div>

      {/* Справочник */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Справочник: себестоимость на гектар (ЦЧР)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(TYPICAL_COSTS_PER_HA).map(([crop, costs]) => {
            const prices = CROP_PRICES_PER_TON[crop];
            return (
              <div key={crop} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-900">{crop}</p>
                <p className="text-lg font-bold mt-1 text-gray-900">{costs.total.toLocaleString("ru-RU")} ₽/га</p>
                {prices && <p className="text-xs text-gray-500 mt-1">Цена реализации: {prices.avg.toLocaleString("ru-RU")} ₽/т</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
