import { NextResponse } from "next/server";
import { passwordOk, setSessionCookie } from "@/lib/auth";
import { PERSONA_LIST } from "@/lib/people";
import { PESAN_GALAT } from "@/lib/copy";

const err = (msg: string, status: number) => NextResponse.json({ error: msg }, { status });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err(PESAN_GALAT.bodyTidakValid, 400);
  }
  if (typeof body !== "object" || body === null) return err(PESAN_GALAT.bodyTidakValid, 400);
  const b = body as Record<string, unknown>;

  let id: (typeof PERSONA_LIST)[number]["id"] | undefined;
  if (b.demo === true) {
    id = "koordinator";
  } else {
    if (typeof b.email !== "string" || typeof b.sandi !== "string" || b.email.length > 200 || b.sandi.length > 200) {
      return err(PESAN_GALAT.bodyTidakValid, 400);
    }
    const email = b.email.trim().toLowerCase();
    const p = PERSONA_LIST.find((x) => x.login === email);
    // Selalu hitung sandi agar waktu respons tidak membedakan email dikenal/tidak.
    const ok = passwordOk(b.sandi);
    if (!p || !ok) return err(PESAN_GALAT.kredensialSalah, 401);
    id = p.id;
  }
  const res = NextResponse.json({ ok: true, persona: id });
  setSessionCookie(res, id);
  return res;
}
