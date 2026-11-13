// Jalankan: npx tsx --conditions=react-server scripts/check-db.ts
import { getRingkasan } from '../lib/data';
import { ops } from '../lib/ops';
import { db, meta } from '../lib/db';
import { deadlineFor, readiness, type Akses, type BlockLite, type Task, type Visit } from '../lib/rules';

const o = ops();
const c = (t: string) => (o.prepare(`select count(*) c from ${t}`).get() as { c: number }).c;
console.log('ops:', { tugas: c('tugas'), kunjungan: c('kunjungan'), aktivitas: c('aktivitas') });

const r = getRingkasan();
console.log('ringkasan:', JSON.stringify({ ...r, per_kabupaten: r.per_kabupaten.slice(0, 3), urus_dulu: r.urus_dulu.slice(0, 2) }, null, 1));

// Query gabungan 05 §5 (P1) + aturan 05 §5 dihitung manual.
const rows = o
  .prepare(`SELECT b.block_id, a.akses FROM ana.blocks b LEFT JOIN ana.seed_akses a ON a.block_id = b.block_id WHERE b.kelas = 'P1'`)
  .all() as { block_id: number; akses: Akses | null }[];
const visits = o.prepare('select block_id, tanggal, muka_air_cm, kondisi_tabat, jenis from kunjungan').all() as Visit[];
const tasks = o.prepare('select block_id, jenis, status, tenggat from tugas').all() as Task[];
const asOf = meta().as_of;
let siap = 0;
for (const x of rows) {
  const dl = deadlineFor(x.akses);
  const lengkap = visits.some(
    (v) => v.block_id === x.block_id && v.muka_air_cm != null && v.kondisi_tabat != null && v.tanggal.slice(0, 10) <= dl && v.tanggal.slice(0, 10) <= asOf,
  );
  const terbukti = tasks.some((t) => t.block_id === x.block_id && t.jenis === 'periksa' && t.status === 'terbukti');
  if (lengkap && terbukti) siap++;
}
const lite = db().prepare(`select block_id, kelas, tipe, hotspot, repeated_cells, last_year, gi_z from blocks where kelas='P1'`).all() as BlockLite[];
const viaRules = readiness(lite, visits, tasks, { asOf, aksesByBlock: Object.fromEntries(rows.map((x) => [x.block_id, x.akses])) });
const ok = siap === r.kesiapan.siap && rows.length === r.kesiapan.wajib && viaRules.siap === siap;
console.log(`manual SQL: ${siap}/${rows.length} | rules: ${viaRules.siap}/${viaRules.wajib} | ringkasan: ${r.kesiapan.siap}/${r.kesiapan.wajib} (${r.kesiapan.pct}%) -> ${ok ? 'COCOK' : 'BEDA'}`);
process.exit(ok ? 0 : 1);
