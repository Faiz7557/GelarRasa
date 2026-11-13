import { NextResponse, type NextRequest } from "next/server";

// Demo tanpa login: semua halaman terbuka; getSession() default ke koordinator.
export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname === "/masuk") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|geo/|favicon|icon|apple-|manifest|sw\\.js|.*\\.(?:png|svg|jpg|jpeg|webp|ico|json|webmanifest|woff2?)$).*)"],
};
