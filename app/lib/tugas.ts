import 'server-only';
import { meta } from './db';
import { ops } from './ops';
import { canTransition, type Peran, type StatusTugas } from './rules';

export const STATUS: readonly StatusTugas[] = ['usulan', 'disetujui', 'diperiksa', 'dirawat', 'terbukti', 'ditolak'];
export const JENIS = ['periksa', 'rawat_tabat', 'basahi', 'verifikasi'] as const;
export const AKTIF: readonly StatusTugas[] = ['usulan', 'disetujui', 'diperiksa', 'dirawat'];
const PERAN: readonly Peran[] = ['koordinator', 'regu', 'pengelola', 'kampus'];

export const isIsoDate = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(s) && !Number.isNaN(Date.parse(s));

export function catat(persona: string, aksi: string, ref: string, ringkas: string): void {
  ops()
    .prepare('INSERT INTO aktivitas(waktu, persona, aksi, ref, ringkas, is_demo) VALUES (?,?,?,?,?,0)')
    .run(new Date().toISOString(), persona, aksi, ref, ringkas);
}

export function hasPhotoVisit(blockId: number): boolean {
  return !!ops().prepare("SELECT 1 FROM kunjungan WHERE block_id = ? AND foto IS NOT NULL AND foto <> '' LIMIT 1").get(blockId);
}

/** Cek transisi 05 §4.1 -> null bila sah, selain itu {status, error}: 409 tidak sah, 403 peran salah. */
export function cekTransisi(from: StatusTugas, to: StatusTugas, role: Peran, blockId: number): { status: number; error: string } | null {
  const sahUntukSiapa = (r: Peran) => canTransition(from, to, r, { hasPhotoVisit: true });
  if (!PERAN.some(sahUntukSiapa)) return { status: 409, error: `Perubahan status dari "${from}" ke "${to}" tidak sah.` };
  if (!sahUntukSiapa(role)) return { status: 403, error: 'Peran Anda tidak boleh melakukan perubahan status ini.' };
  if (!canTransition(from, to, role, { hasPhotoVisit: hasPhotoVisit(blockId) }))
    return { status: 409, error: 'Status "terbukti" memerlukan minimal satu kunjungan berfoto untuk blok ini.' };
  return null;
}

export interface TugasFilter {
  status?: string;
  pemilik?: string;
  kab?: string;
  block?: number;
  id?: string;
}

/** Tugas + kab/kelas/lon/lat dari ana, flag terlambat, has_foto_visit. */
export function listTugas(f: TugasFilter = {}) {
  const w: string[] = [];
  const p: unknown[] = [];
  if (f.id) {
    w.push('t.tugas_id = ?');
    p.push(f.id);
  }
  if (f.status) {
    w.push('t.status = ?');
    p.push(f.status);
  }
  if (f.pemilik) {
    w.push('t.pemilik = ?');
    p.push(f.pemilik);
  }
  if (f.kab) {
    w.push('b.kab_id = ?');
    p.push(f.kab);
  }
  if (f.block !== undefined) {
    w.push('t.block_id = ?');
    p.push(f.block);
  }
  const rows = ops()
    .prepare(
      `SELECT t.*, b.kab_id, kb.nama AS kab, b.kelas, b.lon, b.lat,
         EXISTS(SELECT 1 FROM kunjungan k WHERE k.block_id = t.block_id AND k.foto IS NOT NULL AND k.foto <> '') AS has_foto_visit
       FROM tugas t LEFT JOIN ana.blocks b ON b.block_id = t.block_id LEFT JOIN ana.kabupaten kb ON kb.kab_id = b.kab_id
       ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY t.tenggat, t.tugas_id`,
    )
    .all(...p) as Array<Record<string, unknown> & { tenggat: string; status: string; has_foto_visit: number }>;
  const asOf = meta().as_of;
  return rows.map((r) => ({
    ...r,
    has_foto_visit: !!r.has_foto_visit,
    terlambat: r.tenggat.slice(0, 10) < asOf && r.status !== 'terbukti' && r.status !== 'ditolak',
  }));
}
