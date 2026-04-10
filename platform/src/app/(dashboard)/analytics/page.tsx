"use client";

import { trpc } from "@/lib/trpc";
import { BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES } from "@/lib/constants";

export default function AnalyticsPage() {
  const { data: stats } = trpc.analytics.getDashboardStats.useQuery();
  const { data: utilization } = trpc.analytics.getEquipmentUtilization.useQuery({ days: 30 });

  const statusChartData = stats
    ? [
        { name: "Активна", value: stats.equipment.active, color: EQUIPMENT_STATUSES.ACTIVE.color },
        { name: "Простой", value: stats.equipment.idle, color: EQUIPMENT_STATUSES.IDLE.color },
        { name: "ТО", value: stats.equipment.maintenance, color: EQUIPMENT_STATUSES.MAINTENANCE.color },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Аналитика</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Состояние техники</h2>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              Нет данных
            </div>
          )}
        </div>

        {/* Equipment Utilization */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Загрузка техники (30 дней)</h2>
          {utilization?.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={utilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, "Загрузка"]}
                />
                <Bar dataKey="utilizationPct" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <BarChart3 className="h-12 w-12 mr-3" />
              Добавьте технику и задачи для отображения аналитики
            </div>
          )}
        </div>
      </div>

      {/* Activity Summary */}
      {stats && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Сводка по задачам</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.activities.planned}</p>
              <p className="text-sm text-gray-500 mt-1">Запланировано</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <p className="text-3xl font-bold text-amber-600">{stats.activities.inProgress}</p>
              <p className="text-sm text-gray-500 mt-1">В работе</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.activities.completed}</p>
              <p className="text-sm text-gray-500 mt-1">Выполнено</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
