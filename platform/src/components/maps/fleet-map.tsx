"use client";

import { MapContainer, TileLayer, LayersControl, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { EQUIPMENT_STATUSES, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { MAP_LAYERS } from "@/lib/map-config";
import "leaflet/dist/leaflet.css";

function getMarkerIcon(status: string) {
  const color = EQUIPMENT_STATUSES[status as keyof typeof EQUIPMENT_STATUSES]?.color || "#6b7280";
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function FleetMap({ equipment }: { equipment: any[] }) {
  const withCoords = equipment.filter((e) => e.latitude && e.longitude);
  const center = withCoords.length
    ? { lat: withCoords[0].latitude!, lon: withCoords[0].longitude! }
    : DEFAULT_MAP_CENTER;

  const hasYandex = !!process.env.NEXT_PUBLIC_YANDEX_TILES_API_KEY;

  return (
    <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={withCoords.length ? 12 : DEFAULT_MAP_ZOOM}
        className="h-full w-full"
      >
        <LayersControl position="topright">
          {hasYandex && (
            <LayersControl.BaseLayer checked name="Спутник (Яндекс)">
              <TileLayer attribution={MAP_LAYERS.yandexSat.attribution} url={MAP_LAYERS.yandexSat.url} />
            </LayersControl.BaseLayer>
          )}
          {hasYandex && (
            <LayersControl.BaseLayer name="Схема (Яндекс)">
              <TileLayer attribution={MAP_LAYERS.yandexMap.attribution} url={MAP_LAYERS.yandexMap.url} />
            </LayersControl.BaseLayer>
          )}
          <LayersControl.BaseLayer name="OpenStreetMap" checked={!hasYandex}>
            <TileLayer attribution={MAP_LAYERS.osm.attribution} url={MAP_LAYERS.osm.url} />
          </LayersControl.BaseLayer>
        </LayersControl>

        {withCoords.map((eq) => (
          <Marker
            key={eq.id}
            position={[eq.latitude!, eq.longitude!]}
            icon={getMarkerIcon(eq.status)}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">{eq.name}</p>
                <p>{[eq.make, eq.model].filter(Boolean).join(" ")}</p>
                <p style={{ color: EQUIPMENT_STATUSES[eq.status as keyof typeof EQUIPMENT_STATUSES]?.color }}>
                  {EQUIPMENT_STATUSES[eq.status as keyof typeof EQUIPMENT_STATUSES]?.label}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
