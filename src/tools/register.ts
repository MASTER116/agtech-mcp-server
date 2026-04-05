import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";

// Import providers (side-effect: registers in ProviderRegistry)
import "../providers/open-meteo.js";
import "../providers/soilgrids.js";
import "../providers/faostat.js";

// Conditional provider registrations
import { registerNassProvider } from "../providers/nass.js";
import { registerSentinelProvider } from "../providers/sentinel.js";

// Import tool registrations
import { registerOpenMeteoTools } from "./open-meteo.js";
import { registerSoilGridsTools } from "./soilgrids.js";
import { registerFaostatTools } from "./faostat.js";
import { registerWorldBankTools } from "./worldbank.js";
import { registerCropScapeTools } from "./cropscape.js";
import { registerSmartRoutingTools } from "./smart-routing.js";
import { registerNassTools } from "./nass.js";
import { registerNoaaTools } from "./noaa.js";
import { registerSentinelTools } from "./sentinel.js";
import { registerAppEEARSTools } from "./appeears.js";
import { registerPlantNetTools } from "./plantnet.js";
import { registerEppoTools } from "./eppo.js";
import { registerAgromonitoringTools } from "./agromonitoring.js";
import { registerYandexWeatherTools } from "./yandex-weather.js";

export function registerAllTools(server: McpServer, config: Config): void {
  // ── Register local providers in ProviderRegistry (priority routing) ──
  if (config.nassApiKey) {
    registerNassProvider(config.nassApiKey);
  }
  if (config.sentinelClientId && config.sentinelClientSecret) {
    registerSentinelProvider(config.sentinelClientId, config.sentinelClientSecret);
  }

  // ── Tier 0 — Smart auto-routing tools (always available) ──
  registerSmartRoutingTools(server);

  // ── Tier 1 — always available, no API keys needed ──
  registerOpenMeteoTools(server);
  registerSoilGridsTools(server);
  registerFaostatTools(server);
  registerWorldBankTools(server);
  registerCropScapeTools(server);

  // ── Tier 2 — registered only if API key is configured ──
  if (config.nassApiKey) {
    registerNassTools(server, config.nassApiKey);
  }
  if (config.noaaToken) {
    registerNoaaTools(server, config.noaaToken);
  }
  if (config.sentinelClientId && config.sentinelClientSecret) {
    registerSentinelTools(server, config.sentinelClientId, config.sentinelClientSecret);
  }
  if (config.earthdataUsername && config.earthdataPassword) {
    registerAppEEARSTools(server, config.earthdataUsername, config.earthdataPassword);
  }
  if (config.plantnetApiKey) {
    registerPlantNetTools(server, config.plantnetApiKey);
  }
  if (config.eppoApiKey) {
    registerEppoTools(server, config.eppoApiKey);
  }

  // ── Tier 3 — commercial/limited ──
  if (config.agromonitoringApiKey) {
    registerAgromonitoringTools(server, config.agromonitoringApiKey);
  }
  if (config.yandexWeatherApiKey) {
    registerYandexWeatherTools(server, config.yandexWeatherApiKey);
  }
}
