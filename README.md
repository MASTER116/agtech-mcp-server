# AZAT Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-compatible-blue.svg)](https://modelcontextprotocol.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org)

All-in-one agricultural fleet management platform with predictive analytics, equipment marketplace, and crop planning. Built for the Russian agricultural market.

**[Live Demo](#quick-start)** | **[MCP Server](#mcp-server)** | **[API Docs](#api-integrations)**

---

## What is AZAT Platform?

AZAT Platform is a comprehensive farm management system that combines:

- **Fleet Management** — track tractors, combines, sprayers on a satellite map (Yandex Tiles)
- **Field Management** — draw field boundaries on map, track crop rotations, soil analysis
- **Work Planning** — schedule plowing, seeding, spraying, harvesting with equipment and operator assignment
- **Predictive Analytics** — failure prediction based on engine hours, weather, region, and usage patterns
- **Equipment Marketplace** — rent/sell equipment between farms with AI-powered recommendations
- **IoT Sensors** — ingest data from soil moisture, temperature, pH sensors via REST API
- **Financial Tools** — cost per hectare, season budgeting, profitability analysis
- **Government Subsidies** — calculator for 9 federal and regional subsidy programs with eligibility check
- **Crop Advisor** — recommends new profitable crops based on climate, soil, world market trends
- **Regulatory Compliance** — FGIS Zerno integration, pesticide journal, fuel accounting with waybills

## Architecture

```
                        +------------------+
                        |  AZAT Platform   |
                        |  (Next.js 16)    |
                        |  Port 3001       |
                        +--------+---------+
                                 |
                    +------------+------------+
                    |                         |
          +---------+--------+     +----------+---------+
          |  PostgreSQL      |     |  MCP Server        |
          |  + TimescaleDB   |     |  (Node.js)         |
          |  Port 5433       |     |  Port 3000         |
          +------------------+     +----------+---------+
                                              |
                              +---------------+---------------+
                              |       |       |       |       |
                           Open    Soil   FAOSTAT  Sentinel  USDA
                           Meteo   Grids           Hub       NASS
                              (14+ agricultural data APIs)
```

## Features

### Fleet Management
- 22-model equipment catalog with full specs (fuel consumption, tank capacity, productivity)
- Real-time GPS tracking on Yandex satellite maps
- Maintenance scheduling based on engine hours (TO-1/TO-2/TO-3)
- Common failure database with repair costs and downtime estimates
- Tire tracking, insurance management, operator work logs
- Geofencing with exit/entry alerts

### Predictive Analytics
- Failure probability calculation using engine hours + weather + region + usage patterns
- 10 Russian regional profiles (Krasnodar, Rostov, Altai, etc.) with wear coefficients
- Equipment health index (0-100) with recommendations
- Weather-based wear factors (heat, frost, dust, rain)

### Crop Management
- Crop rotation planner with validation (sunflower: 7-year return period)
- Spray window calculator (wind, temperature, rain, humidity, time of day)
- Frost alert system with crop-specific damage thresholds
- Harvest quality tracking (moisture, gluten, protein, oil content, test weight)
- Crop advisor: 7 alternative crops with world market analysis

### Marketplace
- Equipment rental, services, and sales listings
- AI-powered recommendations based on farm activities and crop rotation
- Price suggestions based on market analytics
- Sections: Rental, Services, Maintenance, Equipment, Farm Supplies

### Financial
- Cost per hectare calculator (fuel + seeds + fertilizer + pesticide + labor)
- Season budget with plan vs actual tracking
- Profitability analysis per field with regional benchmarks
- Live market prices from MOEX, World Bank, FAO

### Integrations
- FGIS Zerno (grain lot registration, SDIZ documents, API v1.0.8+)
- 1C accounting sync queue
- Telegram bot (@azat_platform_bot) with 7 commands
- Sensor data ingestion API (HTTP POST)
- GPS telematics webhook

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| UI Components | Radix UI, Lucide Icons, Recharts |
| Maps | Leaflet + Yandex Tiles API (satellite) + OpenStreetMap |
| API | tRPC v11 (14 routers, 80+ procedures) |
| Database | PostgreSQL 16 + TimescaleDB (35+ models) |
| ORM | Prisma 7 with PrismaPg adapter |
| Auth | NextAuth.js v5 (JWT, RBAC: Owner/Manager/Operator/Viewer) |
| State | Zustand, TanStack Query |
| Data Backend | Custom MCP Server (30+ tools, 14+ APIs) |
| Bot | Telegram Bot API |
| PWA | Web App Manifest, mobile-optimized |

## API Integrations

### Connected (with API keys)
| API | Data | Status |
|-----|------|--------|
| **Yandex Tiles** | Satellite imagery for maps | Active |
| **Copernicus/Sentinel-2** | NDVI vegetation index (10m resolution) | Active |
| **USDA NASS** | US crop statistics (benchmark) | Active |
| **PlantNet** | Plant identification (78,000+ species) | Active |
| **EPPO** | Pest and disease database (97,800+ species) | Configured |
| **Telegram Bot** | Notifications to farmers | Active |

### Built-in (no keys required)
| API | Data |
|-----|------|
| **Open-Meteo** | Weather forecast, historical data, soil temperature |
| **SoilGrids ISRIC** | Soil properties (pH, texture, carbon, nitrogen) |
| **FAOSTAT** | Global crop production statistics |
| **World Bank** | Agricultural macro indicators |
| **CropScape USDA** | Crop type identification (US, 10m) |
| **CBR RF** | USD/RUB exchange rate |

### Live Market Data
| Source | Data | Update Frequency |
|--------|------|-----------------|
| **MOEX ISS** | Wheat futures (RUB/ton) | 15 min delay |
| **CBR RF** | USD/RUB rate | 4 hours |
| **World Bank** | 10 commodity prices | Daily |
| **FAO GIEWS** | Food crisis alerts | Daily |
| **Rosstat** | Russian harvest statistics (2020-2025) | Built-in |

## Quick Start

### Prerequisites
- Node.js 22+
- Docker Desktop (for PostgreSQL)
- npm

### 1. Clone and install
```bash
git clone https://github.com/MASTER116/agtech-mcp-server.git
cd agtech-mcp-server
npm install          # MCP server dependencies
cd platform && npm install  # Platform dependencies
```

### 2. Start PostgreSQL
```bash
docker compose up postgres -d
```

### 3. Configure environment
```bash
cp platform/.env.local.example platform/.env.local
# Edit .env.local with your API keys (optional — works without them)
```

### 4. Setup database
```bash
cd platform
npx prisma db push       # Create tables
npm run db:seed           # Load demo data (Russian farm, 12 equipment, 4 fields)
```

### 5. Start the platform
```bash
npm run dev               # http://localhost:3001
```

### 6. (Optional) Start MCP server
```bash
cd ..
npm run dev               # MCP server on port 3000
```

### Demo credentials
- **Email:** demo@azat.farm
- **Password:** demo123
- **Organization:** KFH "Volkov A.I." (Krasnodar region, 845 ha)

## Equipment Catalog

22 models with full technical specifications:

### Tractors (11 models)
| Model | HP | Tank (L) | Consumption (L/h) | Autonomy | Price (RUB) |
|-------|-----|---------|-------------------|----------|-------------|
| Kirovets K-7M | 300 | 800 | 38 | 21h | 10.5M |
| BELARUS-82.1 | 81 | 130 | 7 | 18h | 2.68M |
| BELARUS-1221.2 | 130 | 160 | 12 | 13h | 4.8M |
| BELARUS-3022 | 303 | 500 | 35 | 14h | 10.5M |
| RSM 2375 | 380 | 681 | 40 | 17h | 16M |
| Terrion ATM 7360 | 360 | 700 | 38 | 18h | 15M |
| Lovol TG2054 | 205 | 260 | 20 | 13h | 5.8M |

### Combines (6 models)
| Model | HP | Tank (L) | Hopper (L) | Productivity | Price (RUB) |
|-------|-----|---------|-----------|-------------|-------------|
| TORUM 785 | 510 | 1100 | 12000 | 45 t/h | 24M |
| ACROS 595 Plus | 327 | 540 | 9000 | 20 t/h | 12M |
| NOVA S300 | 180 | 300 | 4500 | 10 t/h | 5.8M |
| Palesse GS12A1 | 330 | 600 | 8000 | 18 t/h | 14M |

### Also includes
- Sprayers: Tuman-2M, Tuman-3 (Pegas-Agro)
- Trucks: KAMAZ-65115, KAMAZ-43118, Ural NEXT
- Implements: seeders, cultivators, plows, harrows, fertilizer spreaders

## MCP Server

The platform is powered by a standalone MCP server with 30+ tools:

```bash
# Run as stdio (for Claude Desktop / Claude Code)
npm run dev

# Run as HTTP/SSE (for cloud deployment)
TRANSPORT=http PORT=3000 npm start
```

See [MCP Server Documentation](src/README.md) for full tool reference.

## Docker Deployment

```bash
docker compose up -d
# PostgreSQL: port 5433
# MCP Server: port 3000
# Platform: port 3001
```

## Project Structure

```
agtech-mcp-server/
├── src/                          # MCP Server (30+ tools, 14+ APIs)
├── platform/                     # Web Platform (Next.js 16)
│   ├── prisma/schema.prisma      # Database schema (35+ models)
│   ├── prisma/seed.ts            # Demo data (Russian farm)
│   ├── src/
│   │   ├── app/                  # 32 page routes
│   │   ├── server/trpc/          # 14 tRPC routers
│   │   ├── server/mcp/           # MCP client + live data
│   │   ├── server/integrations/  # FGIS Zerno client
│   │   ├── components/maps/      # Leaflet + Yandex maps
│   │   └── lib/                  # Business logic modules
│   │       ├── equipment-catalog.ts    # 22 models with specs
│   │       ├── maintenance-db.ts       # Failure database
│   │       ├── predictive-analytics.ts # Failure prediction engine
│   │       ├── crop-advisor.ts         # New crop recommendations
│   │       ├── crop-rotation.ts        # Rotation rules (9 crops)
│   │       ├── spray-calculator.ts     # Spray window evaluator
│   │       ├── frost-alerts.ts         # Frost damage analyzer
│   │       ├── cost-calculator.ts      # Cost per hectare
│   │       ├── subsidies.ts            # 9 subsidy programs
│   │       └── russia-stats.ts         # Rosstat harvest data
│   └── docker-compose.yml
├── tests/                        # MCP server tests (102+)
└── docker-compose.yml
```

## Monetization Model

| Tier | Price | Limits |
|------|-------|--------|
| **Free** | 0 RUB/mo | 5 users, 10 equipment, 5 fields, 30-day data |
| **Professional** | 3,990 RUB/mo (~$49) | 15 users, 50 equipment, 25 fields, marketplace |
| **Enterprise** | 14,990 RUB/mo (~$199) | Unlimited, API access, white-label, 7% commission |

Additional revenue: marketplace commissions (7-10%), data insights, insurance partnerships.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Rostselmash](https://rostselmash.com) — equipment specifications reference
- [Rosstat](https://rosstat.gov.ru) — Russian harvest statistics
- [FAO](https://www.fao.org) — global agricultural data
- [Copernicus](https://dataspace.copernicus.eu) — satellite imagery
- [Open-Meteo](https://open-meteo.com) — weather data
