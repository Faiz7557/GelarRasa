import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api';
import { getBlokList, KELAS_LIST } from '@/lib/data';
import type { Kelas } from '@/lib/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const kelas = p.get('kelas');
  if (kelas && !KELAS_LIST.includes(kelas as Kelas)) return fail('Parameter kelas harus salah satu dari P1, P2, CEK, PANTAU, LAIN.');
  const kab = p.get('kab') || undefined;
  if (kab && !/^[A-Za-z0-9._-]{1,24}$/.test(kab)) return fail('Parameter kab tidak valid.');
  const limitRaw = p.get('limit');
  const limit = limitRaw === null ? 500 : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > 2000) return fail('Parameter limit harus bilangan bulat 1 sampai 2000.');
  const minRaw = p.get('minobs');
  const minObs = minRaw === null ? undefined : Number(minRaw);
  if (minObs !== undefined && (!Number.isFinite(minObs) || minObs < 0 || minObs > 12)) return fail('Parameter minobs harus angka 0 sampai 12.');
  return ok(getBlokList({ kelas: (kelas as Kelas) || undefined, kab, limit, minObs }));
}
