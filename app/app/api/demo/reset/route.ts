import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { resetOps } from '@/lib/ops';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const r = await requireRole(['koordinator']);
  if ('error' in r) return r.error;
  resetOps(r.persona.id);
  return NextResponse.json({ ok: true });
}
