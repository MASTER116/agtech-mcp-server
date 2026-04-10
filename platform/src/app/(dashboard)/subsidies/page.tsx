"use client";

import { trpc } from "@/lib/trpc";
import { calculateSubsidies, getTotalAvailableSubsidies, type FarmProfile } from "@/lib/subsidies";
import { Banknote, CheckCircle2, XCircle, ExternalLink, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

export default function SubsidiesPage() {
  const { data: fields } = trpc.fields.list.useQuery();
  const { data: equipment } = trpc.fleet.list.useQuery();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const farm: FarmProfile = useMemo(() => ({
    regionId: "krasnodar",
    regionName: "Краснодарский край",
    areaHa: fields?.reduce((s: number, f: any) => s + f.areaHa, 0) || 845,
    equipmentCount: equipment?.length || 12,
    equipmentValue: equipment?.reduce((s: number, e: any) => s + (e.purchasePrice || 0), 0) || 50_000_000,
    crops: fields?.flatMap((f: any) => f.cropSeasons?.map((cs: any) => cs.cropName) || []).filter((v: any, i: any, a: any) => a.indexOf(v) === i) || [],
    isSmallFarm: (fields?.reduce((s: number, f: any) => s + f.areaHa, 0) || 845) <= 500,
    yearsInBusiness: 5,
    hasInsurance: false,
    isYoungFarmer: false,
  }), [fields, equipment]);

  const { total, count, programs } = useMemo(() => getTotalAvailableSubsidies(farm), [farm]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Льготы и субсидии</h1>
        <p className="text-sm text-gray-500 mt-1">
          Расчёт доступных государственных программ поддержки для вашего хозяйства
        </p>
      </div>

      {/* Сводка */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-green-700">Общая сумма доступных субсидий</p>
            <p className="text-4xl font-bold text-green-700 mt-1">{(total / 1_000_000).toFixed(1)} млн ₽</p>
          </div>
          <div>
            <p className="text-sm text-green-700">Доступных программ</p>
            <p className="text-4xl font-bold text-green-700 mt-1">{count}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ваши данные для расчёта:</p>
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              <p>Площадь: {farm.areaHa} га | Техника: {farm.equipmentCount} ед.</p>
              <p>Регион: {farm.regionName}</p>
              <p>Стаж: {farm.yearsInBusiness} лет | Страховка: {farm.hasInsurance ? "Да" : "Нет"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Подсказка */}
      {!farm.hasInsurance && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Banknote className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Оформите страхование урожая!</p>
            <p className="text-xs text-amber-700">Это откроет доступ к субсидии на страхование (~{(farm.areaHa * 450).toLocaleString("ru-RU")} ₽) и повысит шансы на другие программы.</p>
          </div>
        </div>
      )}

      {/* Список программ */}
      <div className="space-y-3">
        {programs.map((result) => {
          const isExpanded = expandedId === result.program.id;
          return (
            <div
              key={result.program.id}
              className={`bg-white rounded-lg border overflow-hidden ${
                result.eligible ? "border-green-200" : "border-gray-200 opacity-75"
              }`}
            >
              {/* Заголовок */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : result.program.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50"
              >
                {result.eligible ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      result.program.level === "federal" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {result.program.level === "federal" ? "Федеральная" : result.program.regionName}
                    </span>
                    <span className="text-xs text-gray-400">{result.program.year}</span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">{result.program.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1">{result.program.description}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  {result.eligible ? (
                    <p className="text-lg font-bold text-green-600">{result.estimatedAmount.toLocaleString("ru-RU")} ₽</p>
                  ) : (
                    <p className="text-sm text-gray-400">Не подходит</p>
                  )}
                </div>

                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>

              {/* Детали */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                  <p className="text-sm text-gray-600">{result.program.description}</p>

                  {/* Расчёт */}
                  {result.eligible && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-700 mb-1">Расчёт для вашего хозяйства:</p>
                      <p className="text-sm text-green-800 font-medium">{result.calculationDetails}</p>
                    </div>
                  )}

                  {/* Причины несоответствия */}
                  {!result.eligible && result.ineligibleReasons.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">Почему не подходит:</p>
                      {result.ineligibleReasons.map((r, i) => (
                        <p key={i} className="text-sm text-red-600">- {r}</p>
                      ))}
                    </div>
                  )}

                  {/* Условия */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Условия получения:</p>
                    {result.program.conditions.map((c, i) => (
                      <p key={i} className="text-xs text-gray-600 flex items-center gap-1">
                        {checkConditionDisplay(c, result.eligible)}
                        {c.label}
                      </p>
                    ))}
                  </div>

                  {/* Документы */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Необходимые документы:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.requiredDocuments.map((doc, i) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                          <FileText className="h-2.5 w-2.5" /> {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Ссылки */}
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <a
                      href={result.program.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" /> Официальный источник
                    </a>
                    <span className="text-xs text-gray-400">{result.program.legalBasis}</span>
                    {result.program.deadline && (
                      <span className="text-xs text-red-500 font-medium">Дедлайн: {result.program.deadline}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function checkConditionDisplay(condition: any, eligible: boolean) {
  return eligible ? (
    <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
  ) : (
    <XCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
  );
}
