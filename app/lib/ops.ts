import 'server-only';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

// DB operasional (05 §4): tulis-baca di os.tmpdir(), disalin dari seed_* tabat.db.
const DDL = `
CREATE TABLE IF NOT EXISTS tugas(tugas_id TEXT PRIMARY KEY, block_id INTEGER, jenis TEXT, status TEXT, pemilik TEXT, tenggat TEXT,
  alasan_tolak TEXT, catatan_tolak TEXT, alasan_sumber TEXT, dibuat_oleh TEXT, created_at TEXT, updated_at TEXT, is_demo INTEGER);
CREATE TABLE IF NOT EXISTS kunjungan(kunjungan_id TEXT PRIMARY KEY, client_id TEXT UNIQUE, tugas_id TEXT, block_id INTEGER, jenis TEXT,
  tanggal TEXT, muka_air_cm INTEGER, tabat_id TEXT, kondisi_tabat TEXT, akses_aktual TEXT, foto TEXT, lon REAL, lat REAL,
  koordinat_sumber TEXT, catatan TEXT, oleh TEXT, created_at TEXT, is_demo INTEGER);
CREATE TABLE IF NOT EXISTS aktivitas(id INTEGER PRIMARY KEY, waktu TEXT, persona TEXT, aksi TEXT, ref TEXT, ringkas TEXT, is_demo INTEGER);
CREATE INDEX IF NOT EXISTS ix_tugas_blok ON tugas(block_id);
CREATE INDEX IF NOT EXISTS ix_kunjungan_blok ON kunjungan(block_id);
`;

const g = globalThis as unknown as { __tabatOps?: Database.Database };

function seed(h: Database.Database) {
  h.exec(`INSERT INTO tugas SELECT * FROM ana.seed_tugas;
          INSERT INTO kunjungan SELECT * FROM ana.seed_kunjungan;
          INSERT INTO aktivitas SELECT * FROM ana.seed_aktivitas;`);
}

/** Koneksi ops (singleton per proses) dengan tabat.db ter-ATTACH sebagai `ana` (read-only). */
export function ops(): Database.Database {
  if (g.__tabatOps) return g.__tabatOps;
  const h = new Database(path.join(os.tmpdir(), 'tabat-ops.sqlite'));
  // URI (?mode=ro) tidak aktif di better-sqlite3; ATTACH berkas biasa, kita tidak pernah menulis ke ana.
  const anaPath = path.join(process.cwd(), 'data', 'tabat.db').replaceAll('\\', '/').replace(/'/g, "''");
  h.exec(`ATTACH DATABASE '${anaPath}' AS ana`);
  h.exec(DDL);
  const n = (h.prepare('SELECT COUNT(*) c FROM tugas').get() as { c: number }).c;
  if (n === 0) h.transaction(() => seed(h))();
  g.__tabatOps = h;
  return h;
}

/** Hapus isi ops, salin ulang seed, catat aktivitas 'reset'. */
export function resetOps(persona = 'koordinator'): void {
  const h = ops();
  h.transaction(() => {
    h.exec('DELETE FROM tugas; DELETE FROM kunjungan; DELETE FROM aktivitas;');
    seed(h);
    h.prepare(`INSERT INTO aktivitas(waktu, persona, aksi, ref, ringkas, is_demo) VALUES (?,?,?,?,?,0)`).run(
      new Date().toISOString(),
      persona,
      'reset',
      '',
      'Data demo dikembalikan ke kondisi awal',
    );
  })();
}

/** Id unik: tugas `T-` + 6 digit. */
export function newTugasId(): string {
  const h = ops();
  const max = (h.prepare(`SELECT MAX(CAST(SUBSTR(tugas_id,3) AS INTEGER)) m FROM tugas WHERE tugas_id GLOB 'T-[0-9][0-9][0-9][0-9][0-9][0-9]'`).get() as { m: number | null }).m ?? 0;
  return `T-${String(max + 1).padStart(6, '0')}`;
}

/** Id unik kunjungan: `K-` + 6 digit. */
export function newKunjunganId(): string {
  const h = ops();
  const max = (h.prepare(`SELECT MAX(CAST(SUBSTR(kunjungan_id,3) AS INTEGER)) m FROM kunjungan WHERE kunjungan_id GLOB 'K-[0-9][0-9][0-9][0-9][0-9][0-9]'`).get() as { m: number | null }).m ?? 0;
  return `K-${String(max + 1).padStart(6, '0')}`;
}

