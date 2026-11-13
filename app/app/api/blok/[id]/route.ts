import { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api';
import { getBlok } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^\d{1,9}$/.test(id)) return fail('Id blok harus bilangan bulat.');
  const data = getBlok(Number(id));
  return data ? ok(data) : fail('Blok tidak ditemukan', 404);
}
