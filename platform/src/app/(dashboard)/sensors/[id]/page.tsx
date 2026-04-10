"use client";

import { trpc } from "@/lib/trpc";
import { useParams } from "next/navigation";
import { ArrowLeft, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { SENSOR_TYPES } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

export default function SensorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [range, setRange] = useState<"24h" | "7d" | "30d">("24h");

  const { data: sensor } = trpc.sensors.getById.useQuery({ id });

  const fromDate = new Date();
  if (range === "24h") fromDate.setHours(fromDate.getHours() - 24);
  else if (range === "7d") fromDate.setDate(fromDate.getDate() - 7);
  else fromDate.setDate(fromDate.getDate() - 30);

  const { data: readings } = trpc.sensors.getReadings.useQuery({ sensorId: id, from: fromDate, limit: 500 });

  if (!sensor) return <div className="animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;

  const sType = SENSOR_TYPES[sensor.type as keyof typeof SENSOR_TYPES];
  const chartData = readings?.map((r: any) => ({
    time: new Date(r.recordedAt).toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }),
    value: Math.round(r.value * 10) / 10,
  })) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/sensors" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{sensor.name}</h1>
          <p className="text-sm text-gray-500">{sType?.label} | {sensor.unit}</p>
        </div>
        {sensor.isOnline ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-gray-400" />}
      </div>

      {/* График */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Показания</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["24h", "7d", "30d"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded text-sm ${range === r ? "bg-white shadow" : ""}`}>
                {r === "24h" ? "24 ч" : r === "7d" ? "7 дн" : "30 дн"}
              </button>
            ))}
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" fontSize={11} />
              <YAxis unit={` ${sensor.unit}`} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">Нет данных за выбранный период</div>
        )}
      </div>

      {/* Инфо */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">Device ID</p><p className="font-mono text-sm">{sensor.deviceId}</p></div>
          <div><p className="text-sm text-gray-500">Последнее чтение</p><p className="text-sm">{sensor.lastReadAt ? formatDateTime(sensor.lastReadAt) : "—"}</p></div>
          <div><p className="text-sm text-gray-500">Батарея</p><p className="text-sm">{sensor.batteryPct != null ? `${sensor.batteryPct}%` : "—"}</p></div>
          {sensor.field && <div><p className="text-sm text-gray-500">Поле</p><p className="text-sm">{sensor.field.name}</p></div>}
        </div>
      </div>
    </div>
  );
}
