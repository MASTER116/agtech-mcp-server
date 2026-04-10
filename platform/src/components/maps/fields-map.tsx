"use client";

import { MapContainer, TileLayer, Polygon, Popup } from "react-leaflet";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { getDefaultTileUrl, getDefaultAttribution } from "@/lib/map-config";
import "leaflet/dist/leaflet.css";

function geoJsonToPositions(boundary: any): [number, number][] {
  try {
    const geo = boundary as { type: string; coordinates: number[][][] };
    if (geo?.type === "Polygon" && geo.coordinates?.[0]) {
      return geo.coordinates[0].map(([lng, lat]) => [lat, lng]);
    }
  } catch {}
  return [];
}

export default function FieldsMap({ fields }: { fields: any[] }) {
  const center = fields.length
    ? { lat: fields[0].centerLat, lon: fields[0].centerLon }
    : DEFAULT_MAP_CENTER;

  return (
    <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={fields.length ? 12 : DEFAULT_MAP_ZOOM}
        className="h-full w-full"
      >
        <TileLayer
          attribution={getDefaultAttribution()}
          url={getDefaultTileUrl()}
        />
        {fields.map((field) => {
          const positions = geoJsonToPositions(field.boundary);
          if (!positions.length) return null;
          return (
            <Polygon
              key={field.id}
              positions={positions}
              pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.2, weight: 2 }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{field.name}</p>
                  <p>{field.areaHa} га</p>
                  {field.cropSeasons[0] && (
                    <p className="text-green-600">{field.cropSeasons[0].cropName}</p>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
}
