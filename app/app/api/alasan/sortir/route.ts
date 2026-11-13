import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { sortirAlasanAI } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const r = await requireRole(['koordinator']);
  if ('error' in r) return r.error;
  let b: { teks?: unknown } | null;
  try {
    b = await req.json();
  } catch {
    return fail('Isi permintaan bukan JSON yang valid.');
  }
  const teks = typeof b?.teks === 'string' ? b.teks.trim() : '';
  if (teks.length < 1 || teks.length > 500) return fail('Teks harus 1 sampai 500 karakter.');
  return ok(await sortirAlasanAI(teks));
}
