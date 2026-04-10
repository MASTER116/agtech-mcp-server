/**
 * Конфигурация карт — Яндекс Tiles API + OSM fallback
 *
 * Яндекс Tiles API: https://yandex.ru/dev/tiles/doc/ru
 * Типы тайлов: map (схема), sat (спутник), skl (подписи поверх спутника)
 */

const YANDEX_KEY = process.env.NEXT_PUBLIC_YANDEX_TILES_API_KEY || "";

export const MAP_LAYERS = {
  /** Яндекс Спутник */
  yandexSat: {
    url: `https://core-sat.maps.yandex.net/tiles?l=sat&x={x}&y={y}&z={z}&lang=ru_RU&apikey=${YANDEX_KEY}`,
    attribution: '&copy; <a href="https://yandex.ru/maps">Яндекс</a>',
    name: "Спутник (Яндекс)",
  },
  /** Яндекс Схема */
  yandexMap: {
    url: `https://core-renderer-tiles.maps.yandex.net/tiles?l=map&x={x}&y={y}&z={z}&lang=ru_RU&apikey=${YANDEX_KEY}`,
    attribution: '&copy; <a href="https://yandex.ru/maps">Яндекс</a>',
    name: "Схема (Яндекс)",
  },
  /** Яндекс Подписи (overlay поверх спутника) */
  yandexLabels: {
    url: `https://core-renderer-tiles.maps.yandex.net/tiles?l=skl&x={x}&y={y}&z={z}&lang=ru_RU&apikey=${YANDEX_KEY}`,
    attribution: "",
    name: "Подписи",
  },
  /** OpenStreetMap (fallback) */
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    name: "Схема (OSM)",
  },
} as const;

/** Тайл по умолчанию — Яндекс спутник если есть ключ, иначе OSM */
export function getDefaultTileUrl(): string {
  if (YANDEX_KEY) return MAP_LAYERS.yandexSat.url;
  return MAP_LAYERS.osm.url;
}

export function getDefaultAttribution(): string {
  if (YANDEX_KEY) return MAP_LAYERS.yandexSat.attribution;
  return MAP_LAYERS.osm.attribution;
}
