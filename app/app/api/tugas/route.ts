import { NextRequest, NextResponse } from 'next/server';
import { fail, ok } from '@/lib/api';
import { getSession, requireRole } from '@/lib/auth';
import { one } from '@/lib/db';
import { newTugasId, ops } from '@/lib/ops';
import { PERSONA_IDS } from '@/lib/people';
import { deadlineFor, type Akses } from '@/lib/rules';
import { AKTIF, JENIS, STATUS, catat, listTugas } from '@/lib/tugas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: 'Belum masuk.' }, { status: 401 });
  const p = req.nextUrl.searchParams;
  const status = p.get('status') || undefined;
  if (status && !(STATUS as readonly string[]).includes(status)) return fail('Parameter status tidak valid.');
  const pemilik = p.get('pemilik') || undefined;
  if (pemilik && !(PERSONA_IDS as readonly string[]).includes(pemilik)) return fail('Parameter pemilik tidak valid.');
  const kab = p.get('kab') || undefined;
  if (kab && !/^[A-Za-z0-9._-]{1,24}$/.test(kab)) return fail('Parameter kab tidak valid.');
  const bl = p.get('block');
  if (bl !== null && !/^\d{1,9}$/.test(bl)) return fail('Parameter block harus bilangan bulat.');
  return ok(listTugas({ status, pemilik, kab, block: bl === null ? undefined : Number(bl) }));
}

export async function POST(req: NextRequest) {
  const r = await requireRole(['koordinator', 'kampus']);
  if ('error' in r) return r.error;
  let b: Record<string, unknown>;
  try {
    b = await req.json();
    if (typeof b !== 'object' || b === null || Array.isArray(b)) throw new Error();
  } catch {
    return fail('Isi permintaan bukan JSON yang valid.');
  }
  const jenis = b.jenis === undefined ? 'periksa' : b.jenis;
  if (!(JENIS as readonly unknown[]).includes(jenis)) return fail('Jenis tugas tidak valid.');
  if (b.catatan !== undefined && (typeof b.catatan !== 'string' || b.catatan.length > 500)) return fail('Catatan maksimal 500 karakter.');
  const massal = Array.isArray(b.block_ids);
  const ids: unknown[] = massal ? (b.block_ids as unknown[]) : [b.block_id];
  if (massal && (ids.length < 1 || ids.length > 50)) return fail('block_ids harus berisi 1 sampai 50 blok.');
  if (!ids.every((x) => Number.isInteger(x) && (x as number) > 0)) return fail('block_id harus bilangan bulat positif.');
  const blockIds = [...new Set(ids as number[])];
  for (const id of blockIds) if (!one('select 1 from blocks where block_id = ?', id)) return fail(`Blok ${id} tidak ditemukan.`, 404);

  const h = ops();
  const aktifQ = h.prepare(`SELECT 1 FROM tugas WHERE block_id = ? AND jenis = ? AND status IN (${AKTIF.map(() => '?').join(',')})`);
  const dibuat: string[] = [];
  let dilewati = 0;
  const now = new Date().toISOString();
  h.transaction(() => {
    for (const id of blockIds) {
      if (aktifQ.get(id, jenis, ...AKTIF)) {
        dilewati++;
        continue;
      }
      const akses = one<{ akses: Akses }>('select akses from seed_akses where block_id = ?', id)?.akses ?? null;
      const tid = newTugasId();
      h.prepare(
        'INSERT INTO tugas(tugas_id, block_id, jenis, status, pemilik, tenggat, dibuat_oleh, created_at, updated_at, is_demo) VALUES (?,?,?,?,?,?,?,?,?,0)',
      ).run(tid, id, jenis, 'usulan', null, deadlineFor(akses), r.persona.id, now, now);
      const cat = typeof b.catatan === 'string' && b.catatan ? `: ${b.catatan}` : '';
      catat(r.persona.id, 'usul', tid, `Tugas ${jenis} diusulkan untuk blok ${id}${cat}`);
      dibuat.push(tid);
    }
  })();
  if (!massal && dilewati) return fail('Blok ini sudah punya tugas aktif dengan jenis yang sama.', 409);
  const tugas = dibuat.flatMap((tid) => listTugas({ id: tid }));
  return NextResponse.json({ data: { dibuat: dibuat.length, dilewati, tugas } }, { status: dibuat.length ? 201 : 200 });
}
