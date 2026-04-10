"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Package, AlertTriangle, Plus } from "lucide-react";
import { SENSOR_TYPES } from "@/lib/constants";

const CATEGORY_LABELS: Record<string, string> = {
  SEEDS: "Семена",
  FERTILIZER: "Удобрения",
  PESTICIDE: "СЗР",
  FUEL: "ГСМ",
  SPARE_PARTS: "Запчасти",
  OTHER_MATERIAL: "Прочее",
};

function AddItemForm({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState("");
  const utils = trpc.useUtils();
  const createItem = trpc.inventory.createItem.useMutation({
    onSuccess: () => { utils.inventory.listItems.invalidate(); onClose(); },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createItem.mutate({
      name: fd.get("name") as string,
      category: fd.get("category") as "SEEDS",
      unit: fd.get("unit") as string,
      minStock: fd.get("minStock") ? Number(fd.get("minStock")) : undefined,
    });
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Новый товар</h2>
      {error && <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">{error}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Наименование *</label>
          <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="Аммиачная селитра" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Категория *</label>
          <select name="category" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Единица *</label>
          <input name="unit" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="кг, л, шт" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Мин. остаток</label>
          <input name="minStock" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="100" />
        </div>
        <div className="md:col-span-2 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Отмена</button>
          <button type="submit" disabled={createItem.isPending} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
            {createItem.isPending ? "Добавление..." : "Добавить"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function InventoryPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: items } = trpc.inventory.listItems.useQuery();
  const { data: lowStock } = trpc.inventory.getLowStock.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Склад</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Добавить товар
        </button>
      </div>

      {showForm && <AddItemForm onClose={() => setShowForm(false)} />}

      {/* Алерт низкого остатка */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Низкий остаток ({lowStock.length})</h3>
          </div>
          <div className="space-y-1">
            {lowStock.map((item: any) => (
              <p key={item.id} className="text-sm text-amber-700">
                <span className="font-medium">{item.name}</span>: {item.currentBalance} {item.unit} (мин. {item.minStock})
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        {!items?.length ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Склад пуст. Добавьте товары и материалы.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Наименование</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Категория</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Остаток</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Мин. остаток</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{CATEGORY_LABELS[item.category] || item.category}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.currentBalance} {item.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.minStock ?? "—"} {item.unit}</td>
                  <td className="px-4 py-3">
                    {item.isLow ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Низкий</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">Норма</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
