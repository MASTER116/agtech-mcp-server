"use client";

import { useState } from "react";
import { Settings, Key, Users, Building2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Настройки</h1>

      {/* Organization Settings */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5" /> Организация
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название организации</label>
            <input className="w-full px-3 py-2 border rounded-lg" placeholder="КФХ Иванов" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Часовой пояс</label>
            <select className="w-full px-3 py-2 border rounded-lg">
              <option value="Europe/Moscow">Москва (UTC+3)</option>
              <option value="Europe/Samara">Самара (UTC+4)</option>
              <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
              <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
            </select>
          </div>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
            Сохранить
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Key className="h-5 w-5" /> API-ключ для датчиков
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Используйте этот ключ для отправки данных с датчиков через API
        </p>
        <div className="flex gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">
            ••••••••••••••••••••••
          </code>
          <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm">
            Показать
          </button>
          <button className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">
            Перегенерировать
          </button>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium mb-2">Пример отправки данных:</p>
          <pre className="text-xs text-gray-600 overflow-x-auto">{`curl -X POST /api/sensors/ingest \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"deviceId":"sensor-01","readings":[{"value":42.5,"timestamp":"2024-01-15T10:30:00Z"}]}'`}</pre>
        </div>
      </div>

      {/* Team */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" /> Команда
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Пригласите участников для совместной работы
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 border rounded-lg"
            placeholder="email@example.com"
          />
          <select className="px-3 py-2 border rounded-lg">
            <option value="OPERATOR">Оператор</option>
            <option value="MANAGER">Менеджер</option>
            <option value="VIEWER">Наблюдатель</option>
          </select>
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm">
            Пригласить
          </button>
        </div>
      </div>
    </div>
  );
}
