"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Tractor,
  Map,
  CalendarDays,
  Activity,
  ShoppingCart,
  BarChart3,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wheat,
  Fuel,
  Package,
  Sprout,
  DollarSign,
  FileCheck,
  MapPin,
  TrendingUp,
  Banknote,
  LineChart,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Панель управления", icon: LayoutDashboard },
  { href: "/fleet", label: "Парк техники", icon: Tractor },
  { href: "/fields", label: "Поля", icon: Map },
  { href: "/activities", label: "Планирование работ", icon: CalendarDays },
  { href: "/agronomy", label: "Агрономия", icon: Sprout },
  { href: "/advisor", label: "Советник по культурам", icon: TrendingUp },
  { href: "/sensors", label: "Датчики", icon: Activity },
  { href: "/fuel", label: "Учёт ГСМ", icon: Fuel },
  { href: "/inventory", label: "Склад", icon: Package },
  { href: "/marketplace", label: "Маркетплейс", icon: ShoppingCart },
  { href: "/budget", label: "Бюджет", icon: DollarSign },
  { href: "/prices", label: "Рыночные данные", icon: LineChart },
  { href: "/subsidies", label: "Субсидии и льготы", icon: Banknote },
  { href: "/grain", label: "ФГИС Зерно", icon: FileCheck },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/maintenance", label: "Обслуживание", icon: Wrench },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-white bg-gray-900 border-r border-gray-200 border-gray-800 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-gray-200 border-gray-800">
        <Wheat className="h-8 w-8 text-green-600 flex-shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg text-gray-900 text-white">
            AZAT
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-gray-100 hover:bg-gray-800"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-green-50 text-green-700 bg-green-900/20 text-green-400"
                  : "text-gray-600 hover:bg-gray-100 text-gray-400 hover:bg-gray-800"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
