// Aturan bisnis TABAT (PRD §5, TRD §5, schema 05 §4.1). Fungsi murni: tanpa I/O, tanpa import server-only.

export type Kelas = 'P1' | 'P2' | 'CEK' | 'PANTAU' | 'LAIN';
export type Akses = 'jalan' | 'sungai' | 'sulit';
export type Urgensi = 'terlambat' | 'minggu_ini' | 'bulan_ini' | 'aman';
export type StatusTugas = 'usulan' | 'disetujui' | 'diperiksa' | 'dirawat' | 'terbukti' | 'ditolak';
export type JenisTugas = 'periksa' | 'rawat_tabat' | 'basahi' | 'verifikasi';
export type Peran = 'koordinator' | 'regu' | 'pengelola' | 'kampus';
export type Alasan =
  | 'akses_terputus'
  | 'sudah_dibasahi'
  | 'bukan_gambut'
  | 'di_luar_kewenangan'
  | 'tabat_sudah_baik'
  | 'lainnya';
export type StatusAir = 'belum' | 'aman' | 'kering';

export interface BlockLite {
  block_id: number;
  kelas: Kelas;
  tipe: number;
  hotspot: boolean | number;
  repeated_cells: number;
  last_year: number;
  gi_z: number | null;
  rank_in_kelas?: number;
  kab_id?: string;
}
export interface Visit {
  block_id: number;
  tanggal: string; // ISO YYYY-MM-DD (bagian waktu diabaikan)
  muka_air_cm: number | null;
  kondisi_tabat: string | null;
  jenis: 'periksa' | 'rawat';
  foto?: string | null;
}
export interface Task {
  block_id: number;
  jenis: JenisTugas;
  status: StatusTugas;
  tenggat: string;
}
export interface CurvePoint {
  n_blok: number;
  pct_luas_berulang: number;
}

export const KELAS_ORDER: readonly Kelas[] = ['P1', 'P2', 'CEK', 'PANTAU', 'LAIN'];
export const DEADLINE = '2027-08-01';
export const LEAD_AKSES: Record<Akses, number> = { jalan: 7, sungai: 14, sulit: 21 };
export const JEDA = 7;
export const AMBANG_AIR_CM = 40;

/** PRD §5.1. Hotspot tanpa jejak (tipe 0) tetap LAIN. */
export function kelasOf(tipe: number, hotspot: boolean | number): Kelas {
  if (tipe === 3) return hotspot ? 'P1' : 'P2';
  if (tipe === 2) return 'CEK';
  if (tipe === 1) return 'PANTAU';
  return 'LAIN';
}

/** PRD §5.2: repeated_cells turun, last_year turun, gi_z turun (null paling bawah), block_id naik. */
export function compareBlocks(a: BlockLite, b: BlockLite): number {
  if (a.repeated_cells !== b.repeated_cells) return b.repeated_cells - a.repeated_cells;
  if (a.last_year !== b.last_year) return b.last_year - a.last_year;
  if (a.gi_z !== b.gi_z) {
    if (a.gi_z == null) return 1;
    if (b.gi_z == null) return -1;
    return b.gi_z - a.gi_z;
  }
  return a.block_id - b.block_id;
}

const DAY = 86_400_000;
function utcMs(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}
/** Selisih hari b - a (UTC murni, tanpa zona waktu lokal). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utcMs(b) - utcMs(a)) / DAY);
}
function addDays(iso: string, n: number): string {
  return new Date(utcMs(iso) + n * DAY).toISOString().slice(0, 10);
}

/** Tenggat = deadline - lead_akses - JEDA. Akses null/undefined -> 'sulit' (konservatif: tenggat paling awal). */
export function deadlineFor(akses?: Akses | null, deadline: string = DEADLINE): string {
  return addDays(deadline, -LEAD_AKSES[akses ?? 'sulit'] - JEDA);
}

export function waterStatus(cm: number | null | undefined): StatusAir {
  if (cm == null) return 'belum';
  return cm <= AMBANG_AIR_CM ? 'aman' : 'kering';
}

/**
 * PRD §5.3. block.tenggat dari deadlineFor(akses). Siap bila ada kunjungan blok itu dengan
 * muka air & kondisi tabat terisi bertanggal <= tenggat (dan <= asOf bila diberikan),
 * DAN ada tugas 'periksa' berstatus 'terbukti'.
 */
export function isReady(
  block: { block_id: number; tenggat: string },
  visits: readonly Visit[],
  tasks: readonly Task[],
  asOf?: string,
): boolean {
  const limit = block.tenggat.slice(0, 10);
  const okVisit = visits.some(
    (v) =>
      v.block_id === block.block_id &&
      v.muka_air_cm != null &&
      v.kondisi_tabat != null &&
      v.tanggal.slice(0, 10) <= limit &&
      (asOf == null || v.tanggal.slice(0, 10) <= asOf.slice(0, 10)),
  );
  if (!okVisit) return false;
  return tasks.some((t) => t.block_id === block.block_id && t.jenis === 'periksa' && t.status === 'terbukti');
}

export interface ReadinessOpts {
  elNino?: boolean;
  aksesByBlock?: Record<number, Akses | null | undefined>;
  deadline?: string;
  asOf?: string;
}

function groupBy<T extends { block_id: number }>(xs: readonly T[]): Map<number, T[]> {
  const m = new Map<number, T[]>();
  for (const x of xs) {
    const l = m.get(x.block_id);
    if (l) l.push(x);
    else m.set(x.block_id, [x]);
  }
  return m;
}

/** wajib = P1 (+P2 bila elNino); pct dibulatkan 1 desimal, 0 bila wajib 0. */
export function readiness(
  blocks: readonly BlockLite[],
  visits: readonly Visit[],
  tasks: readonly Task[],
  opts: ReadinessOpts = {},
): { siap: number; wajib: number; pct: number } {
  const vBy = groupBy(visits);
  const tBy = groupBy(tasks);
  let siap = 0;
  let wajib = 0;
  for (const b of blocks) {
    if (b.kelas !== 'P1' && !(opts.elNino && b.kelas === 'P2')) continue;
    wajib++;
    const tenggat = deadlineFor(opts.aksesByBlock?.[b.block_id], opts.deadline);
    if (isReady({ block_id: b.block_id, tenggat }, vBy.get(b.block_id) ?? [], tBy.get(b.block_id) ?? [], opts.asOf)) siap++;
  }
  return { siap, wajib, pct: wajib === 0 ? 0 : Math.round((siap / wajib) * 1000) / 10 };
}

/** Interpolasi linear antar titik kurva; di luar rentang di-clamp ke ujung. Kurva kosong -> 0. */
function curveAt(curve: readonly CurvePoint[], n: number): number {
  if (curve.length === 0) return 0;
  const c = [...curve].sort((a, b) => a.n_blok - b.n_blok);
  if (n <= c[0].n_blok) return c[0].pct_luas_berulang;
  const last = c[c.length - 1];
  if (n >= last.n_blok) return last.pct_luas_berulang;
  for (let i = 1; i < c.length; i++) {
    if (n <= c[i].n_blok) {
      const p = c[i - 1];
      const q = c[i];
      return p.pct_luas_berulang + ((q.pct_luas_berulang - p.pct_luas_berulang) * (n - p.n_blok)) / (q.n_blok - p.n_blok);
    }
  }
  return last.pct_luas_berulang;
}

/**
 * n blok teratas: urutan kelas P1, P2, CEK, PANTAU (kelas wajib selalu di depan; LAIN tidak
 * pernah diusulkan, sesuai coverage_curve 1.841 blok), dalam kelas memakai compareBlocks.
 * elNino hanya menandai P2 wajib; urutan kelas sama, jadi tidak mengubah hasil.
 */
export function capacityPlan(
  blocks: readonly BlockLite[],
  n: number,
  opts: { elNino?: boolean; coverageCurve?: readonly CurvePoint[] } = {},
): { blocks: BlockLite[]; pctLuasBerulang: number } {
  const rank = (k: Kelas) => KELAS_ORDER.indexOf(k);
  const sorted = blocks
    .filter((b) => b.kelas !== 'LAIN')
    .sort((a, b) => rank(a.kelas) - rank(b.kelas) || compareBlocks(a, b));
  const take = sorted.slice(0, Math.max(0, n));
  return { blocks: take, pctLuasBerulang: curveAt(opts.coverageCurve ?? [], take.length) };
}

/** ready -> aman; lewat tenggat -> terlambat; <= 7 hari -> minggu_ini; <= 31 -> bulan_ini; selain itu aman. */
export function urgency(tenggat: string, today: string, ready: boolean): Urgensi {
  if (ready) return 'aman';
  const sisa = daysBetween(today, tenggat);
  if (sisa < 0) return 'terlambat';
  if (sisa <= 7) return 'minggu_ini';
  if (sisa <= 31) return 'bulan_ini';
  return 'aman';
}

/** Matriks transisi 05 §4.1. Foto wajib untuk -> terbukti. */
export function canTransition(
  from: StatusTugas,
  to: StatusTugas,
  role: Peran,
  ctx: { hasPhotoVisit?: boolean } = {},
): boolean {
  if (to === 'usulan') return role === 'koordinator' && from !== 'usulan';
  if (from === 'usulan' && (to === 'disetujui' || to === 'ditolak')) return role === 'koordinator';
  if (from === 'disetujui' && to === 'diperiksa') return role === 'regu';
  if (from === 'diperiksa' && to === 'dirawat') return role === 'pengelola' || role === 'koordinator';
  if ((from === 'diperiksa' || from === 'dirawat') && to === 'terbukti')
    return (role === 'koordinator' || role === 'kampus') && !!ctx.hasPhotoVisit;
  return false;
}
