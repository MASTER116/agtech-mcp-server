import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";

const readingSchema = z.object({
  value: z.number(),
  timestamp: z.string().or(z.number()),
});

const ingestSchema = z.object({
  deviceId: z.string().min(1),
  readings: z.array(readingSchema).min(1).max(1000),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const org = await db.organization.findUnique({
    where: { apiKey },
  });
  if (!org) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { deviceId, readings } = parsed.data;

  const sensor = await db.sensor.findFirst({
    where: { deviceId, orgId: org.id },
  });
  if (!sensor) {
    return NextResponse.json(
      { error: `Sensor with deviceId '${deviceId}' not found` },
      { status: 404 }
    );
  }

  const data = readings.map((r) => ({
    sensorId: sensor.id,
    value: r.value,
    recordedAt: new Date(r.timestamp),
  }));

  const result = await db.sensorReading.createMany({ data });

  await db.sensor.update({
    where: { id: sensor.id },
    data: {
      isOnline: true,
      lastReadAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    count: result.count,
    sensorId: sensor.id,
  });
}
