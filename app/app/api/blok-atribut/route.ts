import { ok } from '@/lib/api';
import { getBlokAtribut } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return ok(getBlokAtribut(), { headers: { 'Cache-Control': 'private, max-age=30' } });
}
