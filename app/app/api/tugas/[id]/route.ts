import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { ALASAN } from '@/lib/copy';
import { one } from '@/lib/db';
import { ops } from '@/lib/ops';
import { PEOPLE, PERSONA_IDS, type PersonaId } from '@/lib/people';
import { deadlineFor, type Akses, type StatusTugas } from '@/lib/rules';
import { STATUS, catat, cekTransisi, isIsoDate, listTugas } from '@/lib/tugas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = { tugas_id: string; block_id: number; jenis: string; status: StatusTugas };

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const r = await requireRole(PERSONA_IDS);
  if ('error' in r) return r.error;
  const { id } = await ctx.params;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
    if (typeof b !== 'object' || b === null || Array.isArray(b)) throw new Error();
  } catch {
    return fail('Isi permintaan bukan JSON yang valid.');
  }
  const aksi = b.aksi;
  if (aksi !== 'setujui' && aksi !== 'tolak' && aksi !== 'status' && aksi !== 'buka') return fail('Aksi harus salah satu dari setujui, tolak, status, buka.');

  // validasi isi dulu (400), baru cari tugas (404)
  let pemilik: PersonaId = 'regu';
  let tenggat: string | undefined;
  let to: StatusTugas = 'usulan';
  let alasan = '';
  let catatan = '';
  let sumber = 'pilih';
  if (aksi === 'setujui') {
    to = 'disetujui';
    if (b.pemilik !== undefined) {
      if (!(PERSONA_IDS as readonly unknown[]).includes(b.pemilik)) return fail('Pemilik harus salah satu persona yang dikenal.');
      pemilik = b.pemilik as PersonaId;
    }
    if (b.tenggat !== undefined) {
      if (!isIsoDate(b.tenggat)) return fail('Tenggat harus tanggal ISO (YYYY-MM-DD).');
      tenggat = b.tenggat;
    }
  } else if (aksi === 'tolak') {
    to = 'ditolak';
    if (typeof b.alasan !== 'string' || !(ALASAN as readonly string[]).includes(b.alasan)) return fail('Alasan penolakan tidak valid.');
    alasan = b.alasan;
    if (b.catatan !== undefined) {
      if (typeof b.catatan !== 'string' || b.catatan.length > 500) return fail('Catatan maksimal 500 karakter.');
      catatan = b.catatan;
    }
    if (b.alasan_sumber !== undefined) {
      if (b.alasan_sumber !== 'pilih' && b.alasan_sumber !== 'ai' && b.alasan_sumber !== 'kata_kunci') return fail('alasan_sumber harus pilih, ai, atau kata_kunci.');
      sumber = b.alasan_sumber;
    }
  } else if (aksi === 'status') {
    if (typeof b.ke !== 'string' || !(STATUS as readonly string[]).includes(b.ke)) return fail('Status tujuan ("ke") tidak valid.');
    to = b.ke as StatusTugas;
  }

  const h = ops();
  const row = h.prepare('SELECT tugas_id, block_id, jenis, status FROM tugas WHERE tugas_id = ?').get(id) as Row | undefined;
  if (!row) return fail('Tugas tidak ditemukan.', 404);
  const err = cekTransisi(row.status, to, r.persona.id, row.block_id);
  if (err) return fail(err.error, err.status);

  const now = new Date().toISOString();
  const nm = r.persona.nama;
  h.transaction(() => {
    if (aksi === 'setujui') {
      const akses = one<{ akses: Akses }>('select akses from seed_akses where block_id = ?', row.block_id)?.akses ?? null;
      h.prepare('UPDATE tugas SET status=?, pemilik=?, tenggat=?, updated_at=? WHERE tugas_id=?').run(to, pemilik, tenggat ?? deadlineFor(akses), now, id);
      catat(r.persona.id, 'setujui', id, `${nm} menyetujui tugas ${row.jenis} blok ${row.block_id}, pemilik ${PEOPLE[pemilik].nama}`);
    } else if (aksi === 'tolak') {
      h.prepare('UPDATE tugas SET status=?, alasan_tolak=?, catatan_tolak=?, alasan_sumber=?, updated_at=? WHERE tugas_id=?').run(to, alasan, catatan || null, sumber, now, id);
      catat(r.persona.id, 'tolak', id, `${nm} menolak tugas ${row.jenis} blok ${row.block_id}, alasan: ${alasan}`);
    } else if (aksi === 'buka') {
      h.prepare('UPDATE tugas SET status=?, alasan_tolak=NULL, catatan_tolak=NULL, alasan_sumber=NULL, updated_at=? WHERE tugas_id=?').run(to, now, id);
      catat(r.persona.id, 'buka', id, `${nm} membuka ulang tugas ${row.jenis} blok ${row.block_id}`);
    } else {
      h.prepare('UPDATE tugas SET status=?, updated_at=? WHERE tugas_id=?').run(to, now, id);
      catat(r.persona.id, to === 'terbukti' ? 'bukti' : 'status', id, `${nm} mengubah status tugas blok ${row.block_id}: ${row.status} ke ${to}`);
    }
  })();
  return ok(listTugas({ id })[0]);
}
