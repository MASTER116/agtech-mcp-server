"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { getDefaultTileUrl, getDefaultAttribution } from "@/lib/map-config";
import "leaflet/dist/leaflet.css";

interface DrawnField {
  boundary: { type: string; coordinates: number[][][] };
  centerLat: number;
  centerLon: number;
  areaHa: number;
}

interface ExistingField {
  id: string;
  name: string;
  areaHa: number;
  boundary: any;
  centerLat: number;
  centerLon: number;
  cropSeasons?: { cropName: string; seasonYear: number }[];
}

function calcAreaHa(latlngs: L.LatLng[]): number {
  let totalArea = 0;
  for (let i = 0; i < latlngs.length; i++) {
    const j = (i + 1) % latlngs.length;
    totalArea += latlngs[i].lng * latlngs[j].lat;
    totalArea -= latlngs[j].lng * latlngs[i].lat;
  }
  totalArea = Math.abs(totalArea) / 2;
  const metersPerDegLat = 111320;
  const avgLat = latlngs.reduce((s, l) => s + l.lat, 0) / latlngs.length;
  const metersPerDegLon = 111320 * Math.cos((avgLat * Math.PI) / 180);
  const areaM2 = totalArea * metersPerDegLat * metersPerDegLon;
  return Math.round(areaM2 / 10000 * 10) / 10;
}

function geoJsonToLatLngs(boundary: any): L.LatLngExpression[] {
  try {
    if (boundary?.type === "Polygon" && boundary.coordinates?.[0]) {
      return boundary.coordinates[0].map(([lng, lat]: number[]) => [lat, lng] as L.LatLngExpression);
    }
  } catch {}
  return [];
}

export default function FieldDrawMap({
  existingFields = [],
  onFieldDrawn,
}: {
  existingFields?: ExistingField[];
  onFieldDrawn: (field: DrawnField) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const pointsRef = useRef<L.LatLng[]>([]);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const polygonRef = useRef<L.Polygon | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center: L.LatLngExpression = existingFields.length > 0
      ? [existingFields[0].centerLat, existingFields[0].centerLon]
      : [45.35, 40.22];

    const map = L.map(mapRef.current, { center, zoom: existingFields.length > 0 ? 12 : 10 });
    mapInstance.current = map;

    L.tileLayer(getDefaultTileUrl(), {
      attribution: getDefaultAttribution(),
    }).addTo(map);

    // Рисуем существующие поля
    existingFields.forEach((field) => {
      const coords = geoJsonToLatLngs(field.boundary);
      if (coords.length === 0) return;
      const poly = L.polygon(coords, { color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.2, weight: 2 }).addTo(map);
      poly.bindPopup(`<b>${field.name}</b><br>${field.areaHa} га${field.cropSeasons?.[0] ? `<br>${field.cropSeasons[0].cropName}` : ""}`);
    });

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  const startDrawing = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Очистить предыдущее
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    if (polygonRef.current) map.removeLayer(polygonRef.current);
    polylineRef.current = null;
    polygonRef.current = null;
    pointsRef.current = [];
    setPointCount(0);
    setDrawing(true);

    map.getContainer().style.cursor = "crosshair";

    const onClick = (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      pointsRef.current.push(latlng);
      setPointCount(pointsRef.current.length);

      // Маркер точки
      const marker = L.circleMarker(latlng, { radius: 6, color: "#16a34a", fillColor: "#fff", fillOpacity: 1, weight: 2 }).addTo(map);
      markersRef.current.push(marker);

      // Линия
      if (polylineRef.current) map.removeLayer(polylineRef.current);
      polylineRef.current = L.polyline(pointsRef.current.map(p => [p.lat, p.lng]), { color: "#16a34a", weight: 2, dashArray: "6 4" }).addTo(map);
    };

    map.on("click", onClick);
    (map as any)._drawClickHandler = onClick;
  }, []);

  const finishDrawing = useCallback(() => {
    const map = mapInstance.current;
    if (!map || pointsRef.current.length < 3) return;

    map.getContainer().style.cursor = "";
    map.off("click", (map as any)._drawClickHandler);
    setDrawing(false);

    // Убираем линию, рисуем полигон
    if (polylineRef.current) map.removeLayer(polylineRef.current);
    polylineRef.current = null;

    const latlngs = pointsRef.current;
    polygonRef.current = L.polygon(latlngs.map(p => [p.lat, p.lng]), {
      color: "#ea580c", fillColor: "#f97316", fillOpacity: 0.25, weight: 3,
    }).addTo(map);

    const coords = latlngs.map(p => [p.lng, p.lat]);
    coords.push(coords[0]);
    const centerLat = Math.round(latlngs.reduce((s, l) => s + l.lat, 0) / latlngs.length * 10000) / 10000;
    const centerLon = Math.round(latlngs.reduce((s, l) => s + l.lng, 0) / latlngs.length * 10000) / 10000;
    const areaHa = calcAreaHa(latlngs);

    polygonRef.current.bindPopup(`<b>Новое поле</b><br>${areaHa} га`).openPopup();

    onFieldDrawn({ boundary: { type: "Polygon", coordinates: [coords] }, centerLat, centerLon, areaHa });
  }, [onFieldDrawn]);

  const cancelDrawing = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;

    map.getContainer().style.cursor = "";
    map.off("click", (map as any)._drawClickHandler);
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }
    if (polygonRef.current) { map.removeLayer(polygonRef.current); polygonRef.current = null; }
    pointsRef.current = [];
    setPointCount(0);
    setDrawing(false);
  }, []);

  return (
    <div className="space-y-3">
      {/* Панель инструментов */}
      <div className="flex items-center gap-3">
        {!drawing ? (
          <button onClick={startDrawing} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
            Нарисовать границу поля
          </button>
        ) : (
          <>
            <button
              onClick={finishDrawing}
              disabled={pointCount < 3}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Завершить ({pointCount} точек)
            </button>
            <button onClick={cancelDrawing} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Отмена
            </button>
            <span className="text-sm text-gray-500">Кликайте по карте чтобы отметить углы поля</span>
          </>
        )}

        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-green-500 opacity-30 border border-green-600" /> Ваши поля
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-orange-400 opacity-40 border border-orange-500" /> Новое поле
          </span>
        </div>
      </div>

      {/* Карта */}
      <div ref={mapRef} className="h-[500px] rounded-lg border border-gray-300" />
    </div>
  );
}
