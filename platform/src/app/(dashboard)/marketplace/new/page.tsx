"use client";

import { trpc } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { REGIONS_RU } from "@/lib/constants";

export default function NewListingPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { data: equipment } = trpc.fleet.list.useQuery();

  const createListing = trpc.marketplace.create.useMutation({
    onSuccess: () => { router.push("/marketplace/my"); router.refresh(); },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createListing.mutate({
      type: fd.get("type") as "RENTAL",
      title: fd.get("title") as string,
      description: (fd.get("description") as string) || undefined,
      equipmentId: (fd.get("equipmentId") as string) || undefined,
      pricePerDay: fd.get("pricePerDay") ? Number(fd.get("pricePerDay")) : undefined,
      pricePerHa: fd.get("pricePerHa") ? Number(fd.get("pricePerHa")) : undefined,
      availableFrom: new Date(fd.get("availableFrom") as string),
      availableTo: new Date(fd.get("availableTo") as string),
      regionName: (fd.get("regionName") as string) || undefined,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Новое объявление</h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок *</label>
            <input name="title" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="Комбайн ACROS 595 — аренда на уборку" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип *</label>
            <select name="type" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
              <option value="RENTAL">Аренда</option>
              <option value="SERVICE">Услуга</option>
              <option value="SALE">Продажа</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Техника</label>
            <select name="equipmentId" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
              <option value="">— Без привязки —</option>
              {equipment?.map((eq: any) => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цена за день, ₽</label>
            <input name="pricePerDay" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="45000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цена за гектар, ₽</label>
            <input name="pricePerHa" type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="4500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Доступно с *</label>
            <input name="availableFrom" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Доступно до *</label>
            <input name="availableTo" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
            <select name="regionName" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white">
              <option value="">— Выберите —</option>
              {REGIONS_RU.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea name="description" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" placeholder="Опишите состояние техники, условия аренды..." />
        </div>
        <div className="flex gap-3 justify-end">
          <Link href="/marketplace" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Отмена</Link>
          <button type="submit" disabled={createListing.isPending} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
            {createListing.isPending ? "Создание..." : "Опубликовать"}
          </button>
        </div>
      </form>
    </div>
  );
}
