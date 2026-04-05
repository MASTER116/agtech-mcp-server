# agtech-mcp-server

[![npm version](https://img.shields.io/npm/v/agtech-mcp-server.svg)](https://www.npmjs.com/package/agtech-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)

Production-grade [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for agricultural data integration. Provides **30 tools** across **14+ APIs** for weather, soil analysis, satellite imagery, crop statistics, plant identification, and pest databases.

**Tier 1 tools work without any API keys** — just install and use.

## Smart Region-Based Routing

The server automatically detects the region by coordinates and selects the best data provider:

```
Coordinates → GeoResolver → Region (US/EU/RU/CN/BR/IN/GLOBAL)
                                ↓
                        ProviderRegistry
                         ↓          ↓
                   Local API    International API
                  (priority 10)   (priority 5)
                         ↓          ↓
                    USDA NASS  →  FAOSTAT (fallback)
```

- **Local providers** (e.g., USDA NASS for US) get **priority 10** and are tried first
- **International providers** (e.g., FAOSTAT, Open-Meteo) get **priority 5** and serve as fallback
- If a local API fails or is unavailable, the system automatically falls back to international
- New local APIs can be added per region without changing the tool interface

## Quick Start

```bash
npx agtech-mcp-server
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agtech": {
      "command": "npx",
      "args": ["-y", "agtech-mcp-server"],
      "env": {
        "NASS_API_KEY": "your-key-if-needed",
        "NOAA_TOKEN": "your-token-if-needed"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add agtech-mcp-server -- npx -y agtech-mcp-server
```

## Available Tools

### Smart Routing Tools (auto-select best provider per region)

| Tool | Description |
|---|---|
| `detect_region` | Detect region by coordinates, show available providers and priorities |
| `get_field_weather` | Weather with auto-routing: best provider for the location |
| `get_agro_metrics` | Soil temp/moisture, ET0, VPD, frost risk — auto-routed |
| `get_soil_analysis` | Soil properties — auto-routed by region |
| `get_crop_statistics` | Crop stats: US → USDA NASS (local), others → FAOSTAT (international) |

### Tier 1 — Free, No API Keys Required

| Tool | API | Description |
|---|---|---|
| `get_weather_forecast` | Open-Meteo | Weather forecast with soil temperature/moisture, ET0, VPD |
| `get_historical_weather` | Open-Meteo | Historical weather and soil data since 1940 |
| `get_climate_projection` | Open-Meteo | CMIP6 climate model projections |
| `get_soil_properties` | SoilGrids (ISRIC) | Soil pH, texture, organic carbon, nitrogen, bulk density (250m resolution) |
| `get_soil_classification` | SoilGrids (ISRIC) | WRB soil classification |
| `get_crop_production` | FAOSTAT | Crop production data — 245+ countries since 1961 |
| `get_food_prices` | FAOSTAT | Producer prices for agricultural commodities |
| `get_trade_data` | FAOSTAT | Import/export trade flows |
| `get_food_balance` | FAOSTAT | Food balance sheets |
| `get_land_use` | FAOSTAT | Agricultural land use data |
| `get_fertilizer_use` | FAOSTAT | Fertilizer usage data |
| `get_country_ag_indicators` | World Bank | Macro agricultural indicators (200+ countries) |
| `get_crop_type` | CropScape (USDA) | Crop type identification at a point (Continental US, 10m resolution) |
| `get_crop_coverage_stats` | CropScape (USDA) | Crop acreage statistics by region |

### Tier 2 — Free with Registration

| Tool | API | Auth |
|---|---|---|
| `get_usda_crop_statistics` | USDA NASS QuickStats | API Key |
| `get_historical_climate` | NOAA CDO | Token |
| `get_ndvi` | Sentinel Hub (Copernicus) | OAuth2 |
| `get_evi` | Sentinel Hub (Copernicus) | OAuth2 |
| `get_modis_ndvi` | NASA AppEEARS | Earthdata Login |
| `check_appeears_task` | NASA AppEEARS | Earthdata Login |
| `identify_plant` | Pl@ntNet | API Key |
| `search_pest_database` | EPPO | API Key |
| `get_pest_info` | EPPO | API Key |

### Tier 3 — Commercial / Limited

| Tool | API | Auth |
|---|---|---|
| `get_agro_weather` | Agromonitoring | API Key |
| `get_agro_satellite` | Agromonitoring | API Key |
| `get_yandex_forecast` | Yandex Weather | API Key |

## Configuration

Copy `.env.example` to `.env` and fill in the API keys you need. Tier 2/3 tools only appear in the tool list when their keys are configured.

```bash
cp .env.example .env
```

See [.env.example](.env.example) for all available environment variables.

## API Key Registration

| API | Registration | Cost |
|---|---|---|
| USDA NASS | [quickstats.nass.usda.gov/api](https://quickstats.nass.usda.gov/api) | Free |
| NOAA CDO | [ncdc.noaa.gov/cdo-web/token](https://www.ncdc.noaa.gov/cdo-web/token) | Free |
| Sentinel Hub | [dataspace.copernicus.eu](https://dataspace.copernicus.eu/) | Free (40K PU/month) |
| NASA Earthdata | [urs.earthdata.nasa.gov](https://urs.earthdata.nasa.gov/) | Free |
| Pl@ntNet | [my.plantnet.org](https://my.plantnet.org/) | Free (500/day) |
| EPPO | [data.eppo.int](https://data.eppo.int/) | Free |
| Agromonitoring | [agromonitoring.com](https://agromonitoring.com/) | Freemium |
| Yandex Weather | [developer.tech.yandex.ru](https://developer.tech.yandex.ru/services/18) | 7-day trial |

## Development

```bash
git clone https://github.com/MASTER116/agtech-mcp-server.git
cd agtech-mcp-server
npm install
npm run dev          # Run with tsx (development)
npm run build        # Compile TypeScript
npm test             # Run unit tests
npm run test:live    # Run live API smoke tests
```

## Author

**Azat Khaliafiev** (Азат Халяфиев)

## License

[MIT](LICENSE)

---

# agtech-mcp-server (RU)

Production-grade MCP-сервер для интеграции сельскохозяйственных данных. Предоставляет **25 инструментов** по **14+ API**: погода, почва, спутниковые снимки, статистика урожая, идентификация растений, базы вредителей.

**Инструменты Tier 1 работают без API-ключей** — просто установите и используйте.

### Быстрый старт

```bash
npx agtech-mcp-server
```

### Основные возможности

- **Умная маршрутизация** — автоматический выбор лучшего провайдера по координатам: местный API (приоритет 10) или международный (приоритет 5) с автофоллбеком
- **Погода и почва** — прогноз, исторические данные с 1940 г., температура и влажность почвы на 4+ глубинах (Open-Meteo)
- **Свойства почвы** — pH, текстура, азот, углерод, плотность, разрешение 250 м (SoilGrids/ISRIC)
- **Статистика урожая** — производство, цены, торговля, 245+ стран с 1961 г. (FAOSTAT). Для США — USDA NASS с приоритетом
- **Спутниковые данные** — NDVI/EVI с Sentinel-2, разрешение 10 м (Copernicus)
- **Идентификация растений** — 78 123 вида по фото (Pl@ntNet)
- **База вредителей** — 97 800+ видов (EPPO)
- **Климатические проекции** — модели CMIP6 до 2100 года

### Концепция маршрутизации

Сервер использует **бесплатные международные API для любого региона**. Как только подключается местный API — он ставится в приоритет. Если местный API недоступен, автоматически используются международные.

### Автор

**Азат Халяфиев** (Azat Khaliafiev)
