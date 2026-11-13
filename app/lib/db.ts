import 'server-only';
import path from 'node:path';
import Database from 'better-sqlite3';

const g = globalThis as unknown as { __tabatDb?: Database.Database; __tabatMeta?: Record<string, string> };

/** Satu koneksi readonly per proses (analitik, tabat.db). */
export function db(): Database.Database {
  if (!g.__tabatDb) {
    g.__tabatDb = new Database(path.join(process.cwd(), 'data', 'tabat.db'), { readonly: true, fileMustExist: true });
  }
  return g.__tabatDb;
}

export function all<T>(sql: string, ...params: unknown[]): T[] {
  return db().prepare(sql).all(...params) as T[];
}
export function one<T>(sql: string, ...params: unknown[]): T | undefined {
  return db().prepare(sql).get(...params) as T | undefined;
}

/** Tabel meta: as_of, deadline, cell_ha, block_ha, data_window, version, built_at. */
export function meta(): Record<string, string> {
  if (!g.__tabatMeta) {
    g.__tabatMeta = Object.fromEntries(all<{ key: string; value: string }>('select key, value from meta').map((r) => [r.key, r.value]));
  }
  return g.__tabatMeta;
}
