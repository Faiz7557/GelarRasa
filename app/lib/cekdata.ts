import 'server-only';
import { all } from './db';
import { ops } from './ops';

export interface BinObs { tahun: number; berjejak: number; semua: number }

/** Histogram full_obs_years, bin 1 tahun (0–10; nilai maks di DB 9,2). */
export function getObsHistogram(): { bins: BinObs[]; prioritasKurang4: number; prioritasTotal: number } {
  const rows = all<{ b: number; semua: number; berjejak: number }>(
    'select cast(full_obs_years as int) b, count(*) semua, sum(tipe>0) berjejak from blocks group by b',
  );
  const bins = Array.from({ length: 11 }, (_, i) => {
    const r = rows.find((x) => x.b === i);
    return { tahun: i, berjejak: r?.berjejak ?? 0, semua: r?.semua ?? 0 };
  });
  const p = all<{ kurang: number; total: number }>(
    "select coalesce(sum(full_obs_years<4),0) kurang, count(*) total from blocks where kelas in ('P1','P2')",
  )[0];
  return { bins, prioritasKurang4: p.kurang, prioritasTotal: p.total };
}

export function getMusim() {
  return all<{ bulan: number; pct: number }>('select bulan, pct from season_monthly order by bulan');
}

export function getEksternal() {
  return all<{ key: string; persen: number; ukuran: string; sumber: string; tautan: string | null; status: string | null; fitur: string | null }>(
    'select * from external_facts order by key',
  );
}

export interface Penolakan {
  total: number;
  perAlasan: { alasan: string; n: number }[];
  perSumber: { sumber: string; n: number }[];
  contoh: { alasan: string; catatan: string; updated_at: string }[];
}

/** Dibaca dari ops saat request (penolakan baru langsung terlihat). */
export function getPenolakan(): Penolakan {
  const h = ops();
  const perAlasan = h.prepare("select alasan_tolak alasan, count(*) n from tugas where status='ditolak' and alasan_tolak is not null group by 1 order by n desc").all() as Penolakan['perAlasan'];
  const perSumber = h.prepare("select coalesce(alasan_sumber,'pilih') sumber, count(*) n from tugas where status='ditolak' group by 1 order by n desc").all() as Penolakan['perSumber'];
  const contoh = h.prepare("select alasan_tolak alasan, catatan_tolak catatan, updated_at from tugas where status='ditolak' and catatan_tolak is not null and trim(catatan_tolak)<>'' order by updated_at desc limit 3").all() as Penolakan['contoh'];
  return { total: perAlasan.reduce((a, r) => a + r.n, 0), perAlasan, perSumber, contoh };
}
