import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/server/db";
import { z } from "zod";
import { slugify, generateApiKey } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  orgName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте введенные данные", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password, orgName } = parsed.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);

  let slug = slugify(orgName);
  const existingOrg = await db.organization.findUnique({ where: { slug } });
  if (existingOrg) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          org: {
            create: {
              name: orgName,
              slug,
              apiKey: generateApiKey(),
            },
          },
        },
      },
    },
    include: {
      memberships: { include: { org: true } },
    },
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    orgId: user.memberships[0].orgId,
  });
}
