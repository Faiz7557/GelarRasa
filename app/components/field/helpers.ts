import type { TabatLap, TugasLap } from "./types";

export const K_TUGAS = "tabat:lapangan:tugas";
const K_TABAT = "tabat:lapangan:tabat";

export function bacaJson<T>(k: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(k) ?? "null") as T | null;
  } catch {
    return null;
  }
}
export function tulisJson(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export function jarakKm(a: [number, number], b: [number, number]): number {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b[1] - a[1]) / 2) ** 2 + Math.cos(r(a[1])) * Math.cos(r(b[1])) * Math.sin(r(b[0] - a[0]) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** Jenis kunjungan yang sah untuk tugas: periksa hanya saat disetujui; selainnya rawat. */
export const jenisKunjungan = (t: TugasLap | null): "periksa" | "rawat" => (t && !(t.jenis === "periksa" && t.status === "disetujui") ? "rawat" : "periksa");

/** Tugas milik persona (docs/03 §4): regu = periksa (disetujui); pengelola = rawat (diperiksa, atau miliknya yang disetujui); koordinator = keduanya. */
export async function ambilTugas(persona: string): Promise<{ items: TugasLap[]; asOf: string }> {
  const urls =
    persona === "regu" ? ["/api/tugas?pemilik=regu"]
    : persona === "pengelola" ? ["/api/tugas?pemilik=pengelola", "/api/tugas?status=diperiksa"]
    : persona === "koordinator" ? ["/api/tugas?status=disetujui", "/api/tugas?status=diperiksa"]
    : [];
  const peta = new Map<string, TugasLap>();
  let asOf = "";
  for (const u of urls) {
    const r = await fetch(u);
    if (r.status === 401) throw new Error("auth");
    if (!r.ok) throw new Error("galat");
    const j = await r.json();
    asOf = j.meta?.as_of ?? asOf;
    for (const t of j.data as TugasLap[]) peta.set(t.tugas_id, t);
  }
  const ok = (t: TugasLap) => (persona === "regu" ? t.status === "disetujui" : t.status === "disetujui" || t.status === "diperiksa");
  const items = [...peta.values()].filter(ok).sort((a, b) => a.tenggat.localeCompare(b.tenggat) || a.tugas_id.localeCompare(b.tugas_id));
  return { items, asOf };
}

/** Daftar tabat blok: dari server (disimpan), jika gagal dari ponsel; null bila tak diketahui. */
export async function muatTabat(blockId: number): Promise<TabatLap[] | null> {
  const cache = bacaJson<Record<string, TabatLap[]>>(K_TABAT) ?? {};
  try {
    const r = await fetch(`/api/blok/${blockId}`);
    if (!r.ok) throw new Error();
    const t = ((await r.json()).data.tabat ?? []) as TabatLap[];
    tulisJson(K_TABAT, { ...cache, [blockId]: t.map(({ tabat_id, bahan, kondisi_awal }) => ({ tabat_id, bahan, kondisi_awal })) });
    return t;
  } catch {
    return cache[blockId] ?? null;
  }
}
