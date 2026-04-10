const MCP_URL = process.env.MCP_SERVER_URL || "http://localhost:3000";

let sessionId: string | null = null;

async function initialize(): Promise<void> {
  const res = await fetch(`${MCP_URL}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "azat-platform", version: "1.0.0" },
      },
    }),
  });
  sessionId = res.headers.get("mcp-session-id");
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (!sessionId) await initialize();

  const res = await fetch(`${MCP_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId && { "mcp-session-id": sessionId }),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (res.status === 400) {
    sessionId = null;
    return callMcpTool(name, args);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.result?.content?.[0]?.text) {
            return JSON.parse(parsed.result.content[0].text);
          }
        } catch {
          continue;
        }
      }
    }
    return null;
  }

  const data = await res.json();
  if (data.result?.content?.[0]?.text) {
    try {
      return JSON.parse(data.result.content[0].text);
    } catch {
      return data.result.content[0].text;
    }
  }
  return data.result;
}

// Typed wrappers
export async function getWeatherForecast(lat: number, lon: number, days = 7) {
  return callMcpTool("get_weather_forecast", { latitude: lat, longitude: lon, forecast_days: days });
}

export async function getHistoricalWeather(lat: number, lon: number, startDate: string, endDate: string) {
  return callMcpTool("get_historical_weather", { latitude: lat, longitude: lon, start_date: startDate, end_date: endDate });
}

export async function getSoilProperties(lat: number, lon: number) {
  return callMcpTool("get_soil_properties", { latitude: lat, longitude: lon });
}

export async function getAgroMetrics(lat: number, lon: number) {
  return callMcpTool("get_agro_metrics", { latitude: lat, longitude: lon });
}

export async function detectRegion(lat: number, lon: number) {
  return callMcpTool("detect_region", { latitude: lat, longitude: lon });
}

export async function getCropStatistics(commodity: string, countryCode: string) {
  return callMcpTool("get_crop_statistics", { commodity, country_code: countryCode });
}
