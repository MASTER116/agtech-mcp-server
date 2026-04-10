"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ACTIVITY_TYPES } from "@/lib/constants";

export default function NewActivityPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { data: fields } = trpc.fields.list.useQuery();
  const { data: equipment } = trpc.fleet.list.useQuery();

  const createActivity = trpc.activities.create.useMutation({
    onSuccess: () => { router.push("/activities"); router.refresh(); },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createActivity.mutate({
      type: fd.get("type") as "PLOWING",
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      fieldId: (fd.get("fieldId") as string) || undefined,
      plannedStartAt: new Date(fd.get("plannedStartAt") as string),
      plannedEndAt: new Date(fd.get("plannedEndAt") as string),
      inputProduct: (fd.get("inputProduct") as string) || undefined,
      inputRateKgHa: fd.get("inputRateKgHa") ? Number(fd.get("inputRateKgHa")) : undefined,
      estimatedCost: fd.get("estimatedCost") ? Number(fd.get("estimatedCost")) : undefined,
      notes: (fd.get("notes") as string) || undefined,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/activities" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Новая задача</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Название *</label>
            <input name="title" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="Весеннее внесение удобрений" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип работы *</label>
            <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
              {Object.entries(ACTIVITY_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Поле</label>
            <select name="fieldId" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
              <option value="">— Без привязки —</option>
              {fields?.map((f: any) => <option key={f.id} value={f.id}>{f.name} ({f.areaHa} га)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Начало *</label>
            <input name="plannedStartAt" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Окончание *</label>
            <input name="plannedEndAt" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Препарат / Материал</label>
            <input name="inputProduct" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="Аммиачная селитра" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Норма, кг/га</label>
            <input name="inputRateKgHa" type="number" step="0.1" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Плановые затраты, ₽</label>
            <input name="estimatedCost" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
        </div>
        <div className="flex gap-3 justify-end">
          <Link href="/activities" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Отмена</Link>
          <button type="submit" disabled={createActivity.isPending} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
            {createActivity.isPending ? "Создание..." : "Создать задачу"}
          </button>
        </div>
      </form>
    </div>
  );
}
