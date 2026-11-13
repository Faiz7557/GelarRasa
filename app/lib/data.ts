import 'server-only';
import { all, meta, one } from './db';
import { ops } from './ops';
import { fmtTanggal } from './format';
import {
  AMBANG_AIR_CM,
  compareBlocks,
  daysBetween,
  deadlineFor,
  isReady,
  readiness,
  urgency,
  waterStatus,
  type Akses,
  type BlockLite,
  type Kelas,
  type Task,
  type Urgensi,
  type Visit,
} from './rules';

export type StatusBlok = 'belum' | 'sedang' | 'siap';
export const KELAS_LIST: Kelas[] = ['P1', 'P2', 'CEK', 'PANTAU', 'LAIN'];
const STATUS_LIST: StatusBlok[] = ['belum', 'sedang', 'siap'];

const AKTIF = new Set(['usulan', 'disetujui', 'diperiksa', 'dirawat']);
const SELESAI = new Set(['terbukti', 'ditolak']);
const URG_RANK: Record<Urgensi, number> = { terlambat: 0, minggu_ini: 1, bulan_ini: 2, aman: 3 };

interface BlokRow extends BlockLite {
  kab_id: string;
}
interface TugasRow {
  tugas_id: string;
  block_id: number;
  jenis: Task['jenis'];
  status: Task['status'];
  tenggat: string;
}
interface KunjRow {
  kunjungan_id: string;
  block_id: number;
  jenis: 'periksa' | 'rawat';
  tanggal: string;
  muka_air_cm: number | null;
  kondisi_tabat: string | null;
  tabat_id: string | null;
  foto: string | null;
}

export function getMeta() {
  return meta();
}
export function getFacts() {
  return all<{ key: string; value: number; unit: string; label: string; sumber: string }>('select * from facts');
}
export function getReplay() {
  return {
    skenario: all('select * from replay'),
    kurva: all('select * from replay_curve order by n_blok'),
    blok: all('select * from replay_block'),
  };
}
export function getCoverageCurve() {
  return all<{ n_blok: number; pct_blok: number; pct_luas_berulang: number }>('select * from coverage_curve order by n_blok');
}

const BLOK_COLS = 'block_id, kab_id, kelas, tipe, hotspot, repeated_cells, last_year, gi_z';

function aksesMap(): Record<number, Akses> {
  return Object.fromEntries(all<{ block_id: number; akses: Akses }>('select block_id, akses from seed_akses').map((r) => [r.block_id, r.akses]));
}

function readOps() {
  const o = ops();
  return {
    o,
    tugas: o.prepare('SELECT tugas_id, block_id, jenis, status, tenggat FROM tugas').all() as TugasRow[],
    kunj: o.prepare('SELECT kunjungan_id, block_id, jenis, tanggal, muka_air_cm, kondisi_tabat FROM kunjungan').all() as KunjRow[],
  };
}

/** Status per blok: siap / sedang (tugas aktif atau kunjungan) / belum (default, tidak tercatat). */
function statusMap(asOf: string): Map<number, StatusBlok> {
  const { tugas, kunj } = readOps();
  const akses = aksesMap();
  const ids = new Set<number>([...tugas.map((t) => t.block_id), ...kunj.map((k) => k.block_id)]);
  const out = new Map<number, StatusBlok>();
  for (const id of ids) {
    const ts = tugas.filter((t) => t.block_id === id);
    const ks = kunj.filter((k) => k.block_id === id);
    if (isReady({ block_id: id, tenggat: deadlineFor(akses[id]) }, ks as unknown as Visit[], ts as unknown as Task[], asOf)) out.set(id, 'siap');
    else if (ks.length > 0 || ts.some((t) => AKTIF.has(t.status))) out.set(id, 'sedang');
  }
  return out;
}

function alasanRingkas(tahun: number, lastYear: number, ks: KunjRow[], tenggat: string): string {
  const riwayat = `berulang ${tahun} tahun, terakhir ${lastYear || '-'}`;
  if (ks.length === 0) return `${riwayat}, belum diperiksa`;
  const lengkap = ks.some((k) => k.muka_air_cm != null && k.kondisi_tabat != null && k.tanggal.slice(0, 10) <= tenggat);
  return `${riwayat}, ${lengkap ? 'menunggu pembuktian' : 'pemeriksaan belum lengkap'}`;
}

export function getRingkasan({ elNino = false, kab }: { elNino?: boolean; kab?: string | null } = {}) {
  const m = meta();
  const asOf = m.as_of;
  const { o, tugas: tugasAll, kunj: kunjAll } = readOps();
  const akses = aksesMap();
  const kabs = all<{ kab_id: string; nama: string; provinsi: string; fokus: number }>('select kab_id, nama, provinsi, fokus from kabupaten');
  const kabInfo = new Map(kabs.map((k) => [k.kab_id, k]));

  const wajibAll = all<BlokRow>(`select ${BLOK_COLS} from blocks where kelas in (${elNino ? `'P1','P2'` : `'P1'`})`);
  const wajib = kab ? wajibAll.filter((b) => b.kab_id === kab) : wajibAll;

  const visits = kunjAll as unknown as Visit[];
  const tasks = tugasAll as unknown as Task[];
  const opts = { elNino, aksesByBlock: akses, asOf };
  const kesiapan = readiness(wajib, visits, tasks, opts);

  const kunjDi = (id: number) => kunjAll.filter((k) => k.block_id === id);
  const rincian = { diperiksa: 0, air_diukur: 0, tabat_tercatat: 0, terbukti: 0 };
  for (const b of wajib) {
    const ks = kunjDi(b.block_id);
    if (ks.length) rincian.diperiksa++;
    if (ks.some((k) => k.muka_air_cm != null)) rincian.air_diukur++;
    if (ks.some((k) => k.kondisi_tabat != null)) rincian.tabat_tercatat++;
    if (tugasAll.some((t) => t.block_id === b.block_id && t.jenis === 'periksa' && t.status === 'terbukti')) rincian.terbukti++;
  }

  // Per kabupaten: selalu semua kabupaten (filter kab hanya menyaring kesiapan & urus_dulu).
  const perKab = new Map<string, BlokRow[]>();
  for (const b of wajibAll) perKab.set(b.kab_id, [...(perKab.get(b.kab_id) ?? []), b]);
  const per_kabupaten = [...perKab.entries()]
    .map(([id, bs]) => {
      const r = readiness(bs, visits, tasks, opts);
      const k = kabInfo.get(id);
      return { kab_id: id, nama: k?.nama ?? id, provinsi: k?.provinsi ?? '', fokus: k?.fokus === 1, siap: r.siap, wajib: r.wajib, pct: r.pct, belum: r.wajib - r.siap };
    })
    .filter((k) => k.wajib > 0)
    .sort((a, b) => a.pct - b.pct || b.belum - a.belum || a.nama.localeCompare(b.nama));

  const tahunBy = new Map(
    (o.prepare('SELECT block_id, COUNT(*) n FROM ana.block_years WHERE pos_cells > 0 GROUP BY block_id').all() as { block_id: number; n: number }[]).map((r) => [r.block_id, r.n]),
  );
  const cand = wajib
    .map((b) => {
      const ts = tugasAll.filter((t) => t.block_id === b.block_id);
      const ks = kunjDi(b.block_id);
      const dl = deadlineFor(akses[b.block_id]);
      if (isReady({ block_id: b.block_id, tenggat: dl }, ks as unknown as Visit[], ts as unknown as Task[], asOf)) return null;
      const aktif = ts.filter((t) => AKTIF.has(t.status));
      const tenggat = aktif.length ? aktif.map((t) => t.tenggat.slice(0, 10)).sort()[0] : dl;
      return { b, ks, dl, tenggat, urg: urgency(tenggat, asOf, false), punya_tugas: aktif.length > 0 };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((x, y) => URG_RANK[x.urg] - URG_RANK[y.urg] || compareBlocks(x.b, y.b));
  const urus_dulu = cand.slice(0, 5).map(({ b, ks, dl, tenggat, urg, punya_tugas }) => ({
    block_id: b.block_id,
    kab: kabInfo.get(b.kab_id)?.nama ?? b.kab_id,
    kab_id: b.kab_id,
    kelas: b.kelas,
    tenggat,
    urgensi: urg,
    alasan: alasanRingkas(tahunBy.get(b.block_id) ?? 0, b.last_year, ks, dl),
    punya_tugas,
  }));

  const blokKab = kab ? new Set(all<{ block_id: number }>('select block_id from blocks where kab_id = ?', kab).map((r) => r.block_id)) : null;
  const tugas = { terlambat: 0, minggu_ini: 0, menunggu_persetujuan: 0 };
  for (const t of blokKab ? tugasAll.filter((x) => blokKab.has(x.block_id)) : tugasAll) {
    if (t.status === 'usulan') tugas.menunggu_persetujuan++;
    if (SELESAI.has(t.status)) continue;
    const sisa = daysBetween(asOf, t.tenggat);
    if (sisa < 0) tugas.terlambat++;
    else if (sisa <= 7) tugas.minggu_ini++;
  }

  return {
    hari_menuju_tenggat: daysBetween(asOf, m.deadline),
    el_nino: elNino,
    kesiapan,
    rincian_kesiapan: rincian,
    per_kabupaten,
    urus_dulu,
    tugas,
  };
}

export function getBlokList({ kelas, kab, limit = 500, minObs }: { kelas?: Kelas; kab?: string; limit?: number; minObs?: number } = {}) {
  const where: string[] = [];
  const args: unknown[] = [];
  if (kelas) {
    where.push('b.kelas = ?');
    args.push(kelas);
  }
  if (kab) {
    where.push('b.kab_id = ?');
    args.push(kab);
  }
  if (minObs != null) {
    where.push('b.full_obs_years >= ?');
    args.push(minObs);
  }
  const rows = all<Record<string, unknown> & { block_id: number }>(
    `select b.block_id, b.kab_id, k.nama as kab, b.kelas, b.tipe, b.hotspot, b.repeated_cells, b.repeated_pct, b.repeated_ha,
            b.last_year, b.full_obs_years, b.rank_in_kelas, b.rank_global
     from blocks b left join kabupaten k on k.kab_id = b.kab_id
     ${where.length ? 'where ' + where.join(' and ') : ''} order by b.rank_global limit ?`,
    ...args,
    limit,
  );
  const st = statusMap(meta().as_of);
  return rows.map((r) => ({ ...r, status: (st.get(r.block_id) ?? 'belum') as StatusBlok }));
}

/** Ringkas untuk peta: tiap baris = [id, kelasIdx, tipe, hotspot, statusIdx]; indeks merujuk legenda. */
export function getBlokAtribut() {
  const st = statusMap(meta().as_of);
  const rows = all<{ block_id: number; kelas: Kelas; tipe: number; hotspot: number }>('select block_id, kelas, tipe, hotspot from blocks order by block_id');
  return {
    kolom: ['id', 'kelas', 'tipe', 'hotspot', 'status'],
    kelas: KELAS_LIST,
    status: STATUS_LIST,
    baris: rows.map((r) => [r.block_id, KELAS_LIST.indexOf(r.kelas), r.tipe, r.hotspot ? 1 : 0, STATUS_LIST.indexOf(st.get(r.block_id) ?? 'belum')]),
  };
}

export function getBlok(id: number) {
  const asOf = meta().as_of;
  const block = one<Record<string, unknown> & BlockLite & { kab_id: string }>('select * from blocks where block_id = ?', id);
  if (!block) return null;
  const o = ops();
  const years = all<{ tahun: number; pos_cells: number; obs_full_cells: number }>('select tahun, pos_cells, obs_full_cells from block_years where block_id = ? order by tahun', id);
  const kab = one<Record<string, unknown>>('select * from kabupaten where kab_id = ?', block.kab_id) ?? null;
  const akses = one<{ akses: Akses }>('select akses from seed_akses where block_id = ?', id)?.akses ?? null;
  const tabat = all('select * from seed_tabat where block_id = ?', id);
  const tugas = o.prepare('SELECT * FROM tugas WHERE block_id = ? ORDER BY tenggat, tugas_id').all(id) as TugasRow[];
  const kRows = o
    .prepare('SELECT * FROM kunjungan WHERE block_id = ? ORDER BY tanggal DESC, created_at DESC, kunjungan_id DESC')
    .all(id) as KunjRow[];
  const kunjungan = kRows.map(({ foto, ...rest }, i) => ({ ...rest, has_foto: !!foto, ...(i === 0 && foto ? { foto } : {}) }));
  const refs = [...tugas.map((t) => t.tugas_id), ...kRows.map((k) => k.kunjungan_id)];
  const aktivitas = refs.length
    ? (o.prepare(`SELECT * FROM aktivitas WHERE ref IN (${refs.map(() => '?').join(',')}) ORDER BY waktu DESC, id DESC LIMIT 100`).all(...refs) as unknown[])
    : [];

  const dl = deadlineFor(akses);
  const aktif = tugas.filter((t) => AKTIF.has(t.status));
  const tenggat = aktif.length ? aktif.map((t) => t.tenggat.slice(0, 10)).sort()[0] : dl;
  const siap = isReady({ block_id: id, tenggat: dl }, kRows as unknown as Visit[], tugas as unknown as Task[], asOf);
  const urgensi = urgency(tenggat, asOf, siap);
  const terakhir = kRows[0] ?? null;
  const status_air = waterStatus(terakhir?.muka_air_cm);

  const nTahun = years.filter((y) => y.pos_cells > 0).length;
  const riwayat =
    nTahun === 0
      ? 'Tidak berjejak dalam 10 tahun (2015-2024).'
      : `Berjejak ${nTahun} dari 10 tahun, terakhir ${block.last_year}, ${Math.round(Number(block.repeated_pct ?? 0))}% selnya berulang.`;

  let kondisi = 'Belum diperiksa tahun ini.';
  if (terakhir) {
    const air =
      terakhir.muka_air_cm == null
        ? 'Muka air belum diukur'
        : `Muka air ${terakhir.muka_air_cm} cm (${status_air === 'kering' ? 'di bawah' : 'dalam'} ambang ${AMBANG_AIR_CM} cm)`;
    const tb =
      terakhir.kondisi_tabat == null
        ? 'kondisi tabat belum dicatat'
        : terakhir.kondisi_tabat === 'tidak_ada'
          ? 'tidak ada tabat'
          : ['tabat', terakhir.tabat_id, terakhir.kondisi_tabat].filter(Boolean).join(' ');
    kondisi = `${air} · ${tb}`;
  }

  const kt = terakhir?.kondisi_tabat;
  let tindakan: string;
  if (siap) tindakan = 'Sudah siap; pantau sampai tenggat.';
  else if (!terakhir) tindakan = 'Periksa dan ukur muka air; catat kondisi tabat.';
  else if (kt === 'rembes' || kt === 'rusak' || kt === 'jebol') tindakan = `Perbaiki tabat ${kt}; ukur ulang muka air.`;
  else if (kt === 'tidak_ada') tindakan = 'Telusuri lokasi tabat baru; ukur muka air.';
  else if (status_air === 'kering') tindakan = 'Basahi blok dan ukur ulang muka air.';
  else tindakan = 'Lengkapi data pemeriksaan dan ajukan pembuktian.';

  const jawaban = {
    riwayat,
    kondisi,
    tindakan,
    tenggat: `Batas aman periksa ${fmtTanggal(tenggat)} (${akses ? `akses ${akses}` : 'akses belum dicatat'}).`,
  };

  return { block, years, kab, akses, tabat, kunjungan, tugas, aktivitas, urgensi, tenggat, status_air, siap, jawaban };
}
