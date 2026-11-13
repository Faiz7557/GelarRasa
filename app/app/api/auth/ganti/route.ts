import { NextResponse } from "next/server";
import { getSession, setSessionCookie } from "@/lib/auth";
import { isPersonaId } from "@/lib/people";
import { PESAN_GALAT } from "@/lib/copy";

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ error: PESAN_GALAT.belumMasuk }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: PESAN_GALAT.bodyTidakValid }, { status: 400 });
  }
  const persona = typeof body === "object" && body !== null ? (body as Record<string, unknown>).persona : undefined;
  if (!isPersonaId(persona)) return NextResponse.json({ error: PESAN_GALAT.personaTidakDikenal }, { status: 400 });
  const res = NextResponse.json({ ok: true, persona });
  setSessionCookie(res, persona);
  return res;
}
