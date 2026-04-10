"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Plus, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";

const FieldsMap = dynamic(() => import("@/components/maps/fields-map"), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />,
});

export default function FieldsPage() {
  const { data: fields, isLoading } = trpc.fields.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Поля</h1>
        <Link
          href="/fields/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Добавить поле
        </Link>
      </div>

      {fields && <FieldsMap fields={fields} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          ))
        ) : !fields?.length ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <MapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Поля не добавлены</p>
            <Link href="/fields/new" className="text-green-600 text-sm mt-2 inline-block">
              Добавить первое поле
            </Link>
          </div>
        ) : (
          fields.map((field) => (
            <Link
              key={field.id}
              href={`/fields/${field.id}`}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-lg">{field.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{field.areaHa} га</p>
              {field.cropSeasons[0] && (
                <p className="text-sm text-green-600 mt-1">
                  {field.cropSeasons[0].cropName} ({field.cropSeasons[0].seasonYear})
                </p>
              )}
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span>{field._count.activities} задач</span>
                <span>{field._count.sensors} датчиков</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
