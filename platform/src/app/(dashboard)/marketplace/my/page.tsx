"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { EQUIPMENT_CATEGORIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Черновик", color: "#6b7280" },
  ACTIVE: { label: "Активно", color: "#22c55e" },
  RESERVED: { label: "Забронировано", color: "#f59e0b" },
  COMPLETED: { label: "Завершено", color: "#3b82f6" },
  CANCELLED: { label: "Отменено", color: "#ef4444" },
};

export default function MyListingsPage() {
  const { data: listings } = trpc.marketplace.myListings.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Мои объявления</h1>
        </div>
        <Link href="/marketplace/new" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
          <Plus className="h-4 w-4" /> Новое
        </Link>
      </div>

      {!listings?.length ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          У вас пока нет объявлений
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Название</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Техника</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Статус</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Заявки</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings.map((l: any) => {
                const status = STATUS_LABELS[l.status] || STATUS_LABELS.DRAFT;
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/marketplace/${l.id}`} className="font-medium text-green-600 hover:underline">{l.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{l.equipment?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: status.color + "20", color: status.color }}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{l._count?.bookings || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
