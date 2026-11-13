import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ALASAN, KATA_TERLARANG } from "./copy";
import { fmtNum, fmtPct, fmtTanggal } from "./format";
import { sortirKataKunci, type Alasan } from "./reasons";

// AI hanya penulis/penyortir; angka berasal dari fakta server. Tanpa kunci atau galat: fallback, tak pernah melempar.
const CAP = Number(process.env.AI_HOURLY_CAP || 200);
const TIMEOUT_MS = 8000;
const MAKS_CACHE = 500;
const MODEL_SORTIR = "claude-haiku-5-5";
const MODEL_RINGKAS = "claude-sonnet-5-5";

/** Bentuk minimal client yang dipakai (memudahkan suntik client palsu pada uji). */
export type AiClient = {
  messages: { create(body: Record<string, unknown>, opts?: Record<string, unknown>): Promise<{ content: { type: string; text?: string }[] }> };
};
export type Opsi = { client?: AiClient | null };

let _client: AiClient | null | undefined;
function getClient(): AiClient | null {
  if (_client === undefined) _client = process.env.ANTHROPIC_API_KEY ? (new Anthropic() as unknown as AiClient) : null;
  return _client;
}

let jendelaMulai = 0;
let dipakai = 0;
function bolehPanggil(): boolean {
  const now = Date.now();
  // ponytail: jendela tetap 1 jam, bukan bergulir sempurna; cukup sebagai pagar biaya.
  if (now - jendelaMulai > 3_600_000) {
    jendelaMulai = now;
    dipakai = 0;
  }
  if (dipakai >= CAP) return false;
  dipakai++;
  return true;
}

const cache = new Map<string, unknown>();
function simpan(k: string, v: unknown) {
  if (cache.size >= MAKS_CACHE) cache.delete(cache.keys().next().value as string);
  cache.set(k, v);
}

async function tanya(client: AiClient, model: string, system: string, user: string, maxTokens: number): Promise<string | null> {
  const r = await client.messages.create({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }, { timeout: TIMEOUT_MS });
  return r.content.find((b) => b.type === "text")?.text?.trim() || null;
}

// ---------- Sortir alasan ----------
const SISTEM_SORTIR = `Kamu menyortir alasan penolakan usulan tugas pencegahan karhutla gambut. Pilih SATU kategori: ${ALASAN.join(", ")}. Balas JSON saja: {"alasan": "<kategori>"}. Tanpa teks lain.`;

export async function sortirAlasanAI(teks: string, opsi: Opsi = {}): Promise<{ alasan: Alasan; sumber: "ai" | "kata_kunci" }> {
  const fb = { alasan: sortirKataKunci(teks).alasan, sumber: "kata_kunci" as const };
  const client = opsi.client === undefined ? getClient() : opsi.client;
  if (!client) return fb;
  const kunci = `s:${teks}`;
  const c = cache.get(kunci) as { alasan: Alasan; sumber: "ai" } | undefined;
  if (c) return c;
  if (!bolehPanggil()) return fb;
  try {
    const out = await tanya(client, MODEL_SORTIR, SISTEM_SORTIR, teks, 60);
    const json = out?.match(/\{[\s\S]*\}/)?.[0];
    const a = json ? (JSON.parse(json) as { alasan?: unknown }).alasan : null;
    if (typeof a !== "string" || !(ALASAN as readonly string[]).includes(a)) return fb;
    const hasil = { alasan: a as Alasan, sumber: "ai" as const };
    simpan(kunci, hasil);
    return hasil;
  } catch {
    return fb;
  }
}

// ---------- Ringkasan kesiapan ----------
export type FaktaKesiapan = {
  tenggat: string; // ISO
  hari_menuju: number;
  el_nino: boolean;
  siap: number;
  wajib: number;
  pct: number;
  tugas_terlambat: number;
  tugas_menunggu: number;
  kabupaten_tertinggal: { nama: string; siap: number; wajib: number; pct: number }[];
};

/** Bangun fakta dari keluaran getRingkasan() (bentuk struktural, tanpa impor DB). */
export function faktaDariRingkasan(
  r: {
    hari_menuju_tenggat: number;
    el_nino: boolean;
    kesiapan: { siap: number; wajib: number; pct: number };
    per_kabupaten: { nama: string; siap: number; wajib: number; pct: number }[];
    tugas: { terlambat: number; menunggu_persetujuan: number };
  },
  tenggat: string,
): FaktaKesiapan {
  return {
    tenggat,
    hari_menuju: r.hari_menuju_tenggat,
    el_nino: r.el_nino,
    siap: r.kesiapan.siap,
    wajib: r.kesiapan.wajib,
    pct: r.kesiapan.pct,
    tugas_terlambat: r.tugas.terlambat,
    tugas_menunggu: r.tugas.menunggu_persetujuan,
    kabupaten_tertinggal: [...r.per_kabupaten]
      .filter((k) => k.wajib >= 5)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 3)
      .map(({ nama, siap, wajib, pct }) => ({ nama, siap, wajib, pct })),
  };
}

export function templatRingkasan(f: FaktaKesiapan): string {
  const tenggat = fmtTanggal(f.tenggat);
  const waktu = f.hari_menuju >= 0 ? `Tersisa ${fmtNum(f.hari_menuju)} hari menuju tenggat ${tenggat}.` : `Tenggat ${tenggat} sudah lewat ${fmtNum(-f.hari_menuju)} hari.`;
  const kab = f.kabupaten_tertinggal.map((k) => `${k.nama} (${fmtNum(k.siap)} dari ${fmtNum(k.wajib)} blok, ${fmtPct(k.pct)})`).join(", ");
  return [
    waktu,
    `Kesiapan blok prioritas${f.el_nino ? " termasuk skenario El Niño" : ""} saat ini ${fmtPct(f.pct)}, yaitu ${fmtNum(f.siap)} dari ${fmtNum(f.wajib)} blok siap.`,
    kab ? `Kabupaten paling tertinggal: ${kab}.` : "",
    `Ada ${fmtNum(f.tugas_terlambat)} tugas terlambat dan ${fmtNum(f.tugas_menunggu)} tugas menunggu persetujuan.`,
    "Data lapangan, tugas, dan akses masih berupa demo fiktif.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** "34,4" / "1.234" / "123" menjadi angka. Format id-ID: titik = ribuan, koma = desimal. */
export function angkaDalamTeks(teks: string): number[] {
  return (teks.match(/\d+(?:[.,]\d+)*/g) ?? []).map((t) => Number((/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, "") : t).replace(",", ".")));
}

function angkaFakta(f: FaktaKesiapan): Set<number> {
  // Tenggat dipecah (tahun, bulan, hari) agar "1 Agu 2027" lolos; angka bulan memang ikut diizinkan.
  return new Set(angkaDalamTeks(JSON.stringify(f).replace(/(\d+)-0?(\d+)-0?(\d+)/g, "$1 $2 $3")));
}

export function validasiRingkasan(teks: string, f: FaktaKesiapan): boolean {
  const ada = angkaFakta(f);
  const rendah = teks.toLowerCase();
  return (
    angkaDalamTeks(teks).every((n) => ada.has(n)) &&
    !KATA_TERLARANG.some((k) => rendah.includes(k.toLowerCase())) &&
    teks.split(/\s+/).length <= 80 &&
    /demo/i.test(teks)
  );
}

const SISTEM_RINGKAS = `Tulis satu paragraf Bahasa Indonesia, maksimal 80 kata, untuk pimpinan daerah tentang kesiapan pencegahan karhutla gambut, hanya dari objek fakta JSON yang diberikan.
Aturan: DILARANG menambah angka yang tidak ada di fakta. DILARANG memakai kata prediksi, ramalan, peluang, risiko terbakar, dijamin, pasti. Sebut bahwa data lapangan adalah demo. Balas paragraf saja.`;

export async function ringkasanKesiapan(f: FaktaKesiapan, opsi: Opsi = {}): Promise<{ teks: string; sumber: "ai" | "template" }> {
  const fb = { teks: templatRingkasan(f), sumber: "template" as const };
  const client = opsi.client === undefined ? getClient() : opsi.client;
  if (!client) return fb;
  const user = JSON.stringify(f);
  const c = cache.get(`r:${user}`) as { teks: string; sumber: "ai" } | undefined;
  if (c) return c;
  if (!bolehPanggil()) return fb;
  try {
    const teks = await tanya(client, MODEL_RINGKAS, SISTEM_RINGKAS, user, 400);
    if (!teks || !validasiRingkasan(teks, f)) return fb;
    const hasil = { teks, sumber: "ai" as const };
    simpan(`r:${user}`, hasil);
    return hasil;
  } catch {
    return fb;
  }
}
