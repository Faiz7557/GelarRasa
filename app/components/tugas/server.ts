import "server-only";
import { one } from "@/lib/db";
import { ops } from "@/lib/ops";
import { daysBetween, deadlineFor, type Akses } from "@/lib/rules";
import { listTugas } from "@/lib/tugas";
import type { Bukti, TugasKartu } from "./types";

/** Semua tugas + penanda 'minggu ini' + tenggat bawaan dari akses blok. */
export function bangunKartu(asOf: string): TugasKartu[] {
  return (listTugas() as unknown as TugasKartu[]).map((r) => {
    const sisa = daysBetween(asOf, r.tenggat);
    const aktif = r.status !== "terbukti" && r.status !== "ditolak";
    const a = one<{ akses: Akses }>("select akses from seed_akses where block_id = ?", r.block_id)?.akses ?? null;
    return { ...r, mingguIni: aktif && !r.terlambat && sisa >= 0 && sisa <= 7, tenggatBawaan: deadlineFor(a) };
  });
}

/** Kunjungan berfoto terakhir per blok (hanya blok yang diminta). */
export function buktiPerBlok(blockIds: number[]): Record<number, Bukti> {
  const out: Record<number, Bukti> = {};
  const q = ops().prepare(
    "SELECT foto, tanggal, muka_air_cm, kondisi_tabat FROM kunjungan WHERE block_id = ? AND foto IS NOT NULL AND foto <> '' ORDER BY tanggal DESC, created_at DESC, kunjungan_id DESC LIMIT 1",
  );
  for (const id of new Set(blockIds)) {
    const r = q.get(id) as Bukti | undefined;
    if (r) out[id] = r;
  }
  return out;
}
