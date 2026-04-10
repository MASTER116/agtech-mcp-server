"use client";

import { trpc } from "@/lib/trpc";
import Link from "next/link";
import { Activity, Plus, Wifi, WifiOff } from "lucide-react";
import { SENSOR_TYPES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

export default function SensorsPage() {
  const { data: sensors, isLoading } = trpc.sensors.list.useQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Датчики</h1>
        <Link
          href="/sensors/new"
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Добавить датчик
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />)}
        </div>
      ) : !sensors?.length ? (
        <div className="text-center py-12 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Датчики не подключены</p>
          <p className="text-sm mt-2">Подключите датчики через API для получения данных</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => {
            const sType = SENSOR_TYPES[sensor.type as keyof typeof SENSOR_TYPES];
            const lastReading = sensor.readings[0];
            return (
              <Link
                key={sensor.id}
                href={`/sensors/${sensor.id}`}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{sensor.name}</h3>
                  {sensor.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-500">{sType?.label || sensor.type}</p>
                {lastReading ? (
                  <div className="mt-3">
                    <p className="text-3xl font-bold">
                      {lastReading.value.toFixed(1)}
                      <span className="text-sm font-normal text-gray-400 ml-1">{sensor.unit}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(lastReading.recordedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-3">Нет данных</p>
                )}
                {sensor.field && (
                  <p className="text-xs text-gray-400 mt-2">Поле: {sensor.field.name}</p>
                )}
                {sensor.batteryPct != null && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${sensor.batteryPct}%`,
                          backgroundColor: sensor.batteryPct > 20 ? "#22c55e" : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{sensor.batteryPct}%</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
