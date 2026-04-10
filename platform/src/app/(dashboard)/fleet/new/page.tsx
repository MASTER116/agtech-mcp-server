"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEquipmentPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const createEquipment = trpc.fleet.create.useMutation({
    onSuccess: () => {
      router.push("/fleet");
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createEquipment.mutate({
      name: fd.get("name") as string,
      category: fd.get("category") as "TRACTOR",
      make: (fd.get("make") as string) || undefined,
      model: (fd.get("model") as string) || undefined,
      year: fd.get("year") ? Number(fd.get("year")) : undefined,
      serialNumber: (fd.get("serialNumber") as string) || undefined,
      fuelType: (fd.get("fuelType") as string) || undefined,
      engineHours: fd.get("engineHours") ? Number(fd.get("engineHours")) : undefined,
      notes: (fd.get("notes") as string) || undefined,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/fleet" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Добавить технику</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input name="name" required className="w-full px-3 py-2 border rounded-lg" placeholder="Трактор МТЗ-82" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Тип *</label>
            <select name="category" required className="w-full px-3 py-2 border rounded-lg">
              {Object.entries(EQUIPMENT_CATEGORIES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Производитель</label>
            <input name="make" className="w-full px-3 py-2 border rounded-lg" placeholder="МТЗ" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Модель</label>
            <input name="model" className="w-full px-3 py-2 border rounded-lg" placeholder="82.1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Год выпуска</label>
            <input name="year" type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="2020" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Серийный номер</label>
            <input name="serialNumber" className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Тип топлива</label>
            <select name="fuelType" className="w-full px-3 py-2 border rounded-lg">
              <option value="">—</option>
              <option value="diesel">Дизель</option>
              <option value="gasoline">Бензин</option>
              <option value="electric">Электро</option>
              <option value="hybrid">Гибрид</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Моточасы</label>
            <input name="engineHours" type="number" step="0.1" className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Заметки</label>
          <textarea name="notes" rows={3} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="flex gap-3 justify-end">
          <Link href="/fleet" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Отмена</Link>
          <button
            type="submit"
            disabled={createEquipment.isPending}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
          >
            {createEquipment.isPending ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}
