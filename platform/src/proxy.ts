import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// MVP: без авторизации — пропускаем всех
export default function proxy(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
