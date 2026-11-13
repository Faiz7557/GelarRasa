import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PEOPLE, isPersonaId, type Persona, type PersonaId } from "./people";

export const SESSION_COOKIE = "tabat_session";
const MAX_AGE = 60 * 60 * 24 * 7;
const isProd = process.env.NODE_ENV === "production";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (isProd) throw new Error("SESSION_SECRET wajib diisi di produksi.");
  return "tabat-dev-secret-hanya-untuk-lokal-0000";
}

const mac = (id: string) => createHmac("sha256", secret()).update(id).digest("base64url");

export const signSession = (id: PersonaId) => `${id}.${mac(id)}`;

/** Verifikasi constant-time; kembalikan id persona atau null. Dipakai juga oleh proxy.ts. */
export function verifySession(token: string | undefined | null): PersonaId | null {
  if (!token) return null;
  const i = token.indexOf(".");
  if (i < 1) return null;
  const id = token.slice(0, i);
  if (!isPersonaId(id)) return null;
  const a = Buffer.from(token.slice(i + 1));
  const b = Buffer.from(mac(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

/** Sesi dari cookie; tanpa cookie otomatis koordinator (demo tanpa login). */
export async function getSession(): Promise<Persona | null> {
  const id = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return PEOPLE[id ?? "koordinator"];
}

/** Untuk route handler: `const r = await requireRole([...]); if ("error" in r) return r.error;` */
export async function requireRole(roles: readonly PersonaId[]): Promise<{ persona: Persona } | { error: NextResponse }> {
  const persona = await getSession();
  if (!persona) return { error: NextResponse.json({ error: "Belum masuk." }, { status: 401 }) };
  if (!roles.includes(persona.id)) return { error: NextResponse.json({ error: "Peran Anda tidak boleh melakukan ini." }, { status: 403 }) };
  return { persona };
}

export function setSessionCookie(res: NextResponse, id: PersonaId) {
  res.cookies.set(SESSION_COOKIE, signSession(id), { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: MAX_AGE });
}
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: isProd, path: "/", maxAge: 0 });
}

/** Bandingkan kata sandi demo (env DEMO_PASSWORD, default tabat2026) tanpa bocor waktu/panjang. */
export function passwordOk(input: string): boolean {
  const h = (s: string) => createHmac("sha256", "pw").update(s).digest();
  return timingSafeEqual(h(input), h(process.env.DEMO_PASSWORD || "tabat2026"));
}
