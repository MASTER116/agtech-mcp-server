"use client";

import { trpc } from "@/lib/trpc";
import {
  Tractor,
  Map,
  CalendarDays,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from "@/lib/constants";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = trpc.analytics.getDashboardStats.useQuery();

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Панель управления
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Техника"
          value={data.equipment.total}
          subtitle={`${data.equipment.active} активна, ${data.equipment.idle} простой`}
          icon={Tractor}
          href="/fleet"
          color="bg-blue-500"
        />
        <StatCard
          title="Поля"
          value={data.fieldCount}
          icon={Map}
          href="/fields"
          color="bg-green-500"
        />
        <StatCard
          title="Задачи"
          value={data.activities.planned + data.activities.inProgress}
          subtitle={`${data.activities.completed} выполнено`}
          icon={CalendarDays}
          href="/activities"
          color="bg-amber-500"
        />
        <StatCard
          title="Датчики"
          value={data.sensorCount}
          icon={Activity}
          href="/sensors"
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Activities */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Ближайшие задачи</h2>
            <Link
              href="/activities"
              className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              Все <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.upcomingActivities.length === 0 ? (
            <p className="text-sm text-gray-500">Нет запланированных задач</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES]?.label}
                      {activity.field && ` — ${activity.field.name}`}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(activity.plannedStartAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Completed */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Выполненные задачи</h2>
          </div>
          {data.recentActivities.length === 0 ? (
            <p className="text-sm text-gray-500">Нет выполненных задач</p>
          ) : (
            <div className="space-y-3">
              {data.recentActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-gray-50"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ACTIVITY_TYPES[activity.type as keyof typeof ACTIVITY_TYPES]?.label}
                      {activity.field && ` — ${activity.field.name}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
