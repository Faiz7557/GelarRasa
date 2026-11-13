import "server-only";
import { all } from "@/lib/db";

const KOLOM = ["ever_pct", "repeated_pct", "max_years", "elnino_pct", "last_year", "full_obs_years"] as const;
export type KolomIndikator = (typeof KOLOM)[number];

// ponytail: cache modul seumur proses (tabat.db read-only); ribuan baris, aman.
let cache: Record<KolomIndikator, number[]> | null = null;

function muat() {
  const rows = all<Record<KolomIndikator, number | null>>(`select ${KOLOM.join(", ")} from blocks where tipe > 0`);
  return Object.fromEntries(KOLOM.map((k) => [k, rows.map((r) => Number(r[k] ?? 0)).sort((a, b) => a - b)])) as Record<KolomIndikator, number[]>;
}

/** Persentil 0–100 nilai v terhadap blok berjejak (tipe > 0): porsi blok dengan nilai <= v. */
export function persentil(kolom: KolomIndikator, v: number): number {
  const a = (cache ??= muat())[kolom];
  if (!a.length) return 0;
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] <= v) lo = mid + 1;
    else hi = mid;
  }
  return Math.round((lo / a.length) * 100);
}
