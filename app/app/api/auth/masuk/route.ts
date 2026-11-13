import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
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

  if (b.demo !== true) return err(PESAN_GALAT.bodyTidakValid, 400);
  const id = "koordinator" as const;
  const res = NextResponse.json({ ok: true, persona: id });
  setSessionCookie(res, id);
  return res;
}
