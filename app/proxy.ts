import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/masuk" || pathname.startsWith("/api/auth/")) return NextResponse.next();
  if (verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Belum masuk." }, { status: 401 });
  return NextResponse.redirect(new URL("/masuk", req.url));
}

export const config = {
  matcher: ["/((?!_next/|geo/|favicon|icon|apple-|manifest|sw\\.js|.*\\.(?:png|svg|jpg|jpeg|webp|ico|json|webmanifest|woff2?)$).*)"],
};
