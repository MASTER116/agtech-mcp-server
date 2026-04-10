import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";

const positionSchema = z.object({
  deviceId: z.string().min(1),
  lat: z.number(),
  lon: z.number(),
  speed: z.number().optional(),
  heading: z.number().optional(),
  altitude: z.number().optional(),
  engineOn: z.boolean().optional(),
  fuelLevel: z.number().optional(),
  timestamp: z.string().or(z.number()).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = positionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { deviceId, lat, lon, speed, heading, altitude, engineOn, fuelLevel, timestamp } = parsed.data;

  const equipment = await db.equipment.findUnique({
    where: { telematicsId: deviceId },
  });
  if (!equipment) {
    return NextResponse.json(
      { error: `Equipment with telematicsId '${deviceId}' not found` },
      { status: 404 }
    );
  }

  const recordedAt = timestamp ? new Date(timestamp) : new Date();

  await Promise.all([
    db.equipment.update({
      where: { id: equipment.id },
      data: {
        latitude: lat,
        longitude: lon,
        lastPositionAt: recordedAt,
        ...(engineOn !== undefined && { status: engineOn ? "ACTIVE" : "IDLE" }),
      },
    }),
    db.equipmentPosition.create({
      data: {
        equipmentId: equipment.id,
        latitude: lat,
        longitude: lon,
        altitude,
        speed,
        heading,
        engineOn,
        fuelLevel,
        recordedAt,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, equipmentId: equipment.id });
}
