import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api';
import { getRingkasan } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const el = p.get('elnino');
  if (el !== null && el !== '0' && el !== '1') return fail('Parameter elnino harus 0 atau 1.');
  const kab = p.get('kab') || null;
  if (kab && !/^[A-Za-z0-9._-]{1,24}$/.test(kab)) return fail('Parameter kab tidak valid.');
  return ok(getRingkasan({ elNino: el === '1', kab }));
}
