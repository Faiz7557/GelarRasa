import { NextRequest } from 'next/server';
import { ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { faktaDariRingkasan, ringkasanKesiapan } from '@/lib/ai';
import { getMeta, getRingkasan } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const r = await requireRole(['koordinator']);
  if ('error' in r) return r.error;
  const elNino = req.nextUrl.searchParams.get('elnino') === '1';
  const fakta = faktaDariRingkasan(getRingkasan({ elNino }), getMeta().deadline);
  return ok(await ringkasanKesiapan(fakta));
}
