import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { all } from '@/lib/db';
import { getBlokList } from '@/lib/data';
import { AKTIF, listTugas } from '@/lib/tugas';
import { deadlineFor, type Akses } from '@/lib/rules';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BlokRow = { block_id: number; kab: string | null; kelas: string };
type TugasRow = { block_id: number; status: string; tenggat: string; created_at: string; is_demo: number };

const HEADER = ['id_blok', 'kabupaten', 'kelas', 'tenggat', 'status_tugas', 'bujur', 'lintang', 'data_demo'];

const sel = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const koor = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? n.toFixed(5) : '');

export async function GET() {
  const r = await requireRole(['koordinator']);
  if ('error' in r) return r.error;

  const blok = [...getBlokList({ kelas: 'P1', limit: 2000 }), ...getBlokList({ kelas: 'P2', limit: 2000 })] as unknown as BlokRow[];
  const koordinat = new Map(
    all<{ block_id: number; lon: number | null; lat: number | null }>("select block_id, lon, lat from blocks where kelas in ('P1','P2')").map((k) => [
      Number(k.block_id),
      k,
    ]),
  );

  // Akses blok adalah data demo; tenggat dari akses ikut ditandai data_demo = 1.
  const akses = new Map(all<{ block_id: number; akses: Akses }>('select block_id, akses from seed_akses').map((a) => [Number(a.block_id), a.akses]));

  // Tugas aktif terbaru per blok (created_at paling baru).
  const tugasAktif = new Map<number, TugasRow>();
  for (const t of listTugas() as unknown as TugasRow[]) {
    if (!(AKTIF as readonly string[]).includes(t.status)) continue;
    const key = Number(t.block_id);
    const cur = tugasAktif.get(key);
    if (!cur || String(t.created_at) > String(cur.created_at)) tugasAktif.set(key, t);
  }

  const baris = blok.map((b) => {
    const t = tugasAktif.get(Number(b.block_id));
    const k = koordinat.get(Number(b.block_id));
    const a = akses.get(Number(b.block_id));
    const tenggat = t?.tenggat ?? (a ? deadlineFor(a) : '');
    const demo = (t && Number(t.is_demo) === 1) || (!t && a) ? 1 : 0;
    return [b.block_id, b.kab ?? '', b.kelas, tenggat, t?.status ?? '', koor(k?.lon), koor(k?.lat), demo];
  });

  const body = '﻿' + [HEADER, ...baris].map((row) => row.map(sel).join(',')).join('\r\n') + '\r\n';
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tabat-prioritas-2027.csv"',
    },
  });
}
