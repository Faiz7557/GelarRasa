import { NextRequest, NextResponse } from 'next/server';
import { fail } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { one } from '@/lib/db';
import { newKunjunganId, ops } from '@/lib/ops';
import { catat, isIsoDate } from '@/lib/tugas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 300 * 1024;
const MAX_FOTO = 150 * 1024;
const KONDISI = ['baik', 'rembes', 'rusak', 'jebol', 'tidak_ada'];
const AKSES = ['jalan', 'sungai', 'sulit', 'tidak_bisa'];
const FOTO_RE = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;

const opt = (v: unknown) => v === undefined || v === null;

export async function POST(req: NextRequest) {
  const r = await requireRole(['koordinator', 'regu', 'pengelola']);
  if ('error' in r) return r.error;
  const cl = Number(req.headers.get('content-length') ?? 0);
  if (cl > MAX_BODY) return fail('Isi permintaan terlalu besar (maksimal 300 KB).', 413);
  const text = await req.text();
  if (text.length > MAX_BODY) return fail('Isi permintaan terlalu besar (maksimal 300 KB).', 413);
  let b: Record<string, unknown>;
  try {
    b = JSON.parse(text);
    if (typeof b !== 'object' || b === null || Array.isArray(b)) throw new Error();
  } catch {
    return fail('Isi permintaan bukan JSON yang valid.');
  }

  if (typeof b.client_id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(b.client_id)) return fail('client_id wajib, huruf/angka/-/_ maksimal 64 karakter.');
  if (!Number.isInteger(b.block_id)) return fail('block_id wajib bilangan bulat.');
  const blockId = b.block_id as number;
  if (b.jenis !== 'periksa' && b.jenis !== 'rawat') return fail('jenis harus periksa atau rawat.');
  const jenis = b.jenis;
  if (!isIsoDate(b.tanggal)) return fail('tanggal wajib berformat ISO (YYYY-MM-DD).');
  if (!opt(b.muka_air_cm) && !(Number.isInteger(b.muka_air_cm) && (b.muka_air_cm as number) >= 0 && (b.muka_air_cm as number) <= 200)) return fail('muka_air_cm harus bilangan bulat 0 sampai 200 atau kosong.');
  if (!opt(b.kondisi_tabat) && !KONDISI.includes(b.kondisi_tabat as string)) return fail('kondisi_tabat tidak valid.');
  if (!opt(b.akses_aktual) && !AKSES.includes(b.akses_aktual as string)) return fail('akses_aktual tidak valid.');
  if (!opt(b.catatan) && (typeof b.catatan !== 'string' || b.catatan.length > 500)) return fail('Catatan maksimal 500 karakter.');
  if (!opt(b.tabat_id) && (typeof b.tabat_id !== 'string' || b.tabat_id.length > 64)) return fail('tabat_id tidak valid.');
  if (!opt(b.tugas_id) && typeof b.tugas_id !== 'string') return fail('tugas_id tidak valid.');
  if (!opt(b.foto)) {
    const m = typeof b.foto === 'string' ? FOTO_RE.exec(b.foto) : null;
    if (!m) return fail('Foto harus berupa data URL image/jpeg.');
    if (Math.floor((m[1].length * 3) / 4) > MAX_FOTO) return fail('Foto terlalu besar (maksimal 150 KB).', 413);
  }
  if (!opt(b.lon) && !(typeof b.lon === 'number' && Number.isFinite(b.lon))) return fail('lon harus angka.');
  if (!opt(b.lat) && !(typeof b.lat === 'number' && Number.isFinite(b.lat))) return fail('lat harus angka.');
  const sumber = opt(b.koordinat_sumber) ? 'centroid' : b.koordinat_sumber;
  if (sumber !== 'gps' && sumber !== 'centroid') return fail('koordinat_sumber harus gps atau centroid.');

  // peran per jenis
  const boleh = jenis === 'periksa' ? ['koordinator', 'regu'] : ['koordinator', 'pengelola'];
  if (!boleh.includes(r.persona.id)) return fail(`Peran Anda tidak boleh mencatat kunjungan ${jenis}.`, 403);

  const h = ops();
  const dup = h.prepare('SELECT kunjungan_id FROM kunjungan WHERE client_id = ?').get(b.client_id) as { kunjungan_id: string } | undefined;
  if (dup) return NextResponse.json({ data: { kunjungan_id: dup.kunjungan_id, duplikat: true } }, { status: 200 });

  const blok = one<{ lon: number; lat: number }>('select lon, lat from blocks where block_id = ?', blockId);
  if (!blok) return fail('Blok tidak ditemukan.', 404);
  let lon = b.lon as number | null | undefined;
  let lat = b.lat as number | null | undefined;
  if (sumber === 'gps' && (opt(lon) || opt(lat))) return fail('Koordinat gps memerlukan lon dan lat.');
  if (sumber === 'centroid' && (opt(lon) || opt(lat))) {
    lon = blok.lon;
    lat = blok.lat;
  }

  let tugasId: string | null = null;
  if (typeof b.tugas_id === 'string') {
    const t = h.prepare('SELECT 1 FROM tugas WHERE tugas_id = ? AND block_id = ?').get(b.tugas_id, blockId);
    if (!t) return fail('tugas_id tidak ditemukan untuk blok ini.', 404);
    tugasId = b.tugas_id;
  }

  const dari = jenis === 'periksa' ? 'disetujui' : 'diperiksa';
  const ke = jenis === 'periksa' ? 'diperiksa' : 'dirawat';
  const now = new Date().toISOString();
  const kid = h.transaction(() => {
    const id = newKunjunganId();
    // tugas terkait: yang diberikan, selainnya tugas blok ini berstatus `dari` yang terbaru
    const t = (
      tugasId
        ? h.prepare('SELECT tugas_id, status FROM tugas WHERE tugas_id = ?').get(tugasId)
        : h.prepare('SELECT tugas_id, status FROM tugas WHERE block_id = ? AND status = ? ORDER BY created_at DESC, tugas_id DESC LIMIT 1').get(blockId, dari)
    ) as { tugas_id: string; status: string } | undefined;
    h.prepare(
      `INSERT INTO kunjungan(kunjungan_id, client_id, tugas_id, block_id, jenis, tanggal, muka_air_cm, tabat_id, kondisi_tabat, akses_aktual, foto, lon, lat, koordinat_sumber, catatan, oleh, created_at, is_demo)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`,
    ).run(id, b.client_id, t?.tugas_id ?? null, blockId, jenis, b.tanggal, b.muka_air_cm ?? null, b.tabat_id ?? null, b.kondisi_tabat ?? null, b.akses_aktual ?? null, b.foto ?? null, lon ?? null, lat ?? null, sumber, b.catatan ?? null, r.persona.id, now);
    catat(r.persona.id, 'kunjungan', id, `${r.persona.nama} mencatat kunjungan ${jenis} di blok ${blockId}`);
    if (t && t.status === dari) {
      h.prepare('UPDATE tugas SET status=?, updated_at=? WHERE tugas_id=?').run(ke, now, t.tugas_id);
      catat(r.persona.id, 'status', t.tugas_id, `Tugas blok ${blockId} berubah otomatis: ${dari} ke ${ke}`);
    }
    return id;
  })();
  return NextResponse.json({ data: { kunjungan_id: kid } }, { status: 201 });
}
