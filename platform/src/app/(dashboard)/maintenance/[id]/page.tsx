"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MaintenanceDetailPage() {
  const params = useParams();
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/maintenance" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold">Запись обслуживания</h1>
      </div>
      <div className="bg-white rounded-lg border p-6 text-center text-gray-500">
        Детальная страница ТО: {params.id}
      </div>
    </div>
  );
}
