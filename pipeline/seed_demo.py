"""Data lapangan DEMO FIKTIF (05 §3). Deterministik: default_rng(SEED). Semua baris is_demo = 1.
Jalankan setelah build_db.py: /c/Python313/python.exe pipeline/seed_demo.py
"""
import sqlite3, sys, uuid
from datetime import date, datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C

AS_OF = date.fromisoformat(C.AS_OF); DEADLINE = date.fromisoformat(C.DEADLINE)
LEAD = {'jalan': 7, 'sungai': 14, 'sulit': 21}
# JPEG 1x1 placeholder (bukan foto nyata; seed demo)
FOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
# laju blok P1 siap per kabupaten (parameter cerita demo, bukan angka riset); default untuk kabupaten lain
RATE = {'Pulang Pisau': 0.50, 'Kotawaringin Timur': 0.30, 'Seruyan': 0.25, 'Kapuas': 0.25, 'Sukamara': 0.07,
        'Barito Selatan': 0.20, 'Kotawaringin Barat': 0.25, 'Katingan': 0.10, 'Ketapang': 0.30}
RATE_DEFAULT = 0.30
RATE_P2 = 0.25

SCHEMA = """
DROP TABLE IF EXISTS seed_akses; DROP TABLE IF EXISTS seed_tabat; DROP TABLE IF EXISTS seed_tugas;
DROP TABLE IF EXISTS seed_kunjungan; DROP TABLE IF EXISTS seed_aktivitas;
CREATE TABLE seed_akses(block_id INTEGER PRIMARY KEY, akses TEXT, is_demo INTEGER);
CREATE TABLE seed_tabat(tabat_id TEXT PRIMARY KEY, block_id INTEGER, lon REAL, lat REAL, bahan TEXT, kondisi_awal TEXT, is_demo INTEGER);
CREATE TABLE seed_tugas(tugas_id TEXT PRIMARY KEY, block_id INTEGER, jenis TEXT, status TEXT, pemilik TEXT, tenggat TEXT, alasan_tolak TEXT,
  catatan_tolak TEXT, alasan_sumber TEXT, dibuat_oleh TEXT, created_at TEXT, updated_at TEXT, is_demo INTEGER);
CREATE TABLE seed_kunjungan(kunjungan_id TEXT PRIMARY KEY, client_id TEXT UNIQUE, tugas_id TEXT, block_id INTEGER, jenis TEXT, tanggal TEXT,
  muka_air_cm INTEGER, tabat_id TEXT, kondisi_tabat TEXT, akses_aktual TEXT, foto TEXT, lon REAL, lat REAL, koordinat_sumber TEXT,
  catatan TEXT, oleh TEXT, created_at TEXT, is_demo INTEGER);
CREATE TABLE seed_aktivitas(id INTEGER PRIMARY KEY, waktu TEXT, persona TEXT, aksi TEXT, ref TEXT, ringkas TEXT, is_demo INTEGER);
CREATE INDEX ix_seed_tugas_blok ON seed_tugas(block_id); CREATE INDEX ix_seed_kunj_blok ON seed_kunjungan(block_id);
"""

TOLAK = [  # 5 contoh, 4 kategori
    ('akses_terputus', 'Jembatan menuju blok putus sejak Mei, regu tidak bisa lewat.', 'pilih'),
    ('akses_terputus', 'jalan ke blok tergenang, perahu tidak muat', 'kata_kunci'),
    ('sudah_dibasahi', 'Blok sudah dibasahi regu lain minggu lalu.', 'ai'),
    ('di_luar_kewenangan', 'Lahan di dalam konsesi perusahaan, bukan kewenangan dinas.', 'pilih'),
    ('tabat_sudah_baik', 'Tabat baru diperbaiki bulan lalu, kondisi baik.', 'ai'),
]


def iso(d, h=3):
    return datetime(d.year, d.month, d.day, h, 0, 0).strftime('%Y-%m-%dT%H:%M:%SZ')


def main():
    rng = np.random.default_rng(C.SEED)
    con = sqlite3.connect(C.DB_PATH)
    B = pd.read_sql('SELECT b.block_id, b.kelas, b.rank_in_kelas, b.lon, b.lat, k.nama AS kab FROM blocks b JOIN kabupaten k USING(kab_id) '
                    "WHERE b.kelas IN ('P1','P2','CEK') ORDER BY b.kelas, b.rank_in_kelas", con)
    con.executescript(SCHEMA)

    # ---- seed_akses: per kelas 50/35/15 (deterministik via rng)
    akses = {}
    for kel, g in B.groupby('kelas'):
        ids = rng.permutation(g.block_id.to_numpy()); n = len(ids); a, s = round(.50 * n), round(.35 * n)
        for i, b in enumerate(ids):
            akses[int(b)] = 'jalan' if i < a else 'sungai' if i < a + s else 'sulit'
    con.executemany('INSERT INTO seed_akses VALUES (?,?,1)', sorted(akses.items()))
    tenggat_blok = {b: DEADLINE - timedelta(days=LEAD[a] + 7) for b, a in akses.items()}

    # ---- seed_tabat: 0-3 per blok P1/P2
    tabat = {}; rows = []
    for r in B[B.kelas.isin(['P1', 'P2'])].itertuples():
        for n in range(1, int(rng.choice([0, 1, 2, 3], p=[.2, .3, .3, .2])) + 1):
            tid = f'TB-{r.block_id}-{n}'
            rows.append((tid, int(r.block_id), float(r.lon + rng.uniform(-.009, .009)), float(r.lat + rng.uniform(-.009, .009)),
                         str(rng.choice(['kayu', 'karung_tanah', 'beton'], p=[.5, .35, .15])),
                         str(rng.choice(['baik', 'rembes', 'rusak', 'jebol'], p=[.4, .25, .25, .1])), 1))
            tabat.setdefault(int(r.block_id), []).append((tid, rows[-1][4], rows[-1][5]))
    con.executemany('INSERT INTO seed_tabat VALUES (?,?,?,?,?,?,?)', rows)

    # ---- pilih blok siap
    siap = set()
    for kab, g in B[B.kelas == 'P1'].groupby('kab'):
        k = round(RATE.get(kab, RATE_DEFAULT) * len(g))
        siap |= set(int(x) for x in rng.choice(g.block_id.to_numpy(), k, replace=False))
    p2 = B[B.kelas == 'P2'].block_id.to_numpy()
    siap |= set(int(x) for x in rng.choice(p2, round(RATE_P2 * len(p2)), replace=False))
    sisa_p1 = [int(x) for x in rng.permutation(B[(B.kelas == 'P1') & ~B.block_id.isin(siap)].block_id.to_numpy())]
    sisa_p2 = [int(x) for x in rng.permutation(B[(B.kelas == 'P2') & ~B.block_id.isin(siap)].block_id.to_numpy())]
    sisa_cek = [int(x) for x in rng.permutation(B[B.kelas == 'CEK'].block_id.to_numpy())]
    pos = B.set_index('block_id')

    T, K, A = [], [], []
    seq = {'t': 0, 'k': 0}

    def new_visit(tid, b, jenis, tgl, lengkap=True, foto=True, oleh='regu'):
        seq['k'] += 1; row = pos.loc[b]; tb = tabat.get(b, [])
        t = tb[int(rng.integers(len(tb)))] if tb else None
        kondisi = (t[2] if rng.random() < .8 else str(rng.choice(['baik', 'rembes', 'rusak', 'jebol']))) if t else 'tidak_ada'
        gps = rng.random() < .8
        K.append((f'K-{seq["k"]:06d}', str(uuid.UUID(int=int(rng.integers(0, 2**63)) << 64 | int(rng.integers(0, 2**63)), version=4)), tid, b, jenis, tgl.isoformat(),
                  (int(rng.integers(5, 36)) if rng.random() < .55 else int(rng.integers(41, 110))) if lengkap else None,
                  t[0] if t else None, kondisi if lengkap or jenis == 'rawat' else None,
                  akses[b] if rng.random() < .85 else 'tidak_bisa' if rng.random() < .3 else akses[b], FOTO if foto else None,
                  float(row.lon + (rng.uniform(-.006, .006) if gps else 0)), float(row.lat + (rng.uniform(-.006, .006) if gps else 0)),
                  'gps' if gps else 'centroid', 'Demo fiktif: catatan kunjungan.' if rng.random() < .3 else None, oleh, iso(tgl, 9), 1))
        A.append((iso(tgl, 9), oleh, 'kunjungan', f'K-{seq["k"]:06d}', f'Kunjungan {jenis} blok {b}'))

    def new_task(b, jenis, status, pemilik, tenggat, created, updated, dibuat='koordinator', tolak=None):
        seq['t'] += 1; tid = f'T-{seq["t"]:06d}'
        T.append((tid, b, jenis, status, pemilik, tenggat.isoformat(), tolak[0] if tolak else None, tolak[1] if tolak else None,
                  tolak[2] if tolak else None, dibuat, iso(created, 2), iso(updated, 4), 1))
        A.append((iso(created, 2), dibuat, 'usulan', tid, f'Usulan tugas {jenis} blok {b}'))
        if status != 'usulan':
            A.append((iso(created + timedelta(days=1), 3), 'koordinator', 'tolak' if status == 'ditolak' else 'setujui', tid,
                      f'{"Tolak" if status == "ditolak" else "Setujui"} tugas {tid}'))
        return tid

    def rand_day(lo, hi):  # tanggal acak antara lo..hi (inklusif)
        return lo + timedelta(days=int(rng.integers(0, (hi - lo).days + 1)))

    # ---- terbukti (siap): kunjungan lengkap berfoto sebelum tenggat + tugas periksa terbukti
    for b in sorted(siap):
        tg = tenggat_blok[b]; created = rand_day(date(2027, 3, 1), date(2027, 4, 20)); tgl = rand_day(created + timedelta(days=3), date(2027, 5, 28))
        tid = new_task(b, 'periksa', 'terbukti', 'regu', tg, created, tgl + timedelta(days=2), dibuat=str(rng.choice(['koordinator', 'kampus'])))
        new_visit(tid, b, 'periksa', tgl)
        A.append((iso(tgl + timedelta(days=2), 5), 'kampus', 'bukti', tid, f'Bukti diverifikasi, tugas {tid} terbukti'))

    # ---- tugas belum terbukti: status x jumlah x (terlambat)
    plan = [('usulan', 14, 1), ('disetujui', 16, 4), ('diperiksa', 12, 3), ('dirawat', 9, 2)]
    pools = {'P1': sisa_p1, 'P2': sisa_p2, 'CEK': sisa_cek}
    def take(kelas=None):
        k = kelas or ('P1' if rng.random() < .85 else 'P2' if rng.random() < .7 else 'CEK')
        return pools[k].pop()
    for status, n, late in plan:
        for i in range(n):
            b = take(); tg = tenggat_blok[b]
            if i < late:
                tg = AS_OF - timedelta(days=int(rng.integers(3, 26)))  # tenggat ditetapkan koordinator lebih awal (milestone), sudah lewat
            created = rand_day(date(2027, 4, 1), date(2027, 5, 20))
            upd = min(created + timedelta(days=int(rng.integers(1, 12))), AS_OF - timedelta(days=1))
            jenis = 'rawat_tabat' if status == 'dirawat' else 'basahi' if (status == 'disetujui' and i % 5 == 4) else 'periksa'
            pemilik = 'pengelola' if jenis in ('rawat_tabat', 'basahi') else 'regu'
            tid = new_task(b, jenis, status, pemilik, tg, created, upd, dibuat='koordinator' if status != 'usulan' else str(rng.choice(['koordinator', 'kampus', 'regu'])))
            if status in ('diperiksa', 'dirawat'):
                tgl = rand_day(created + timedelta(days=2), upd)
                new_visit(tid, b, 'periksa', tgl, lengkap=bool(rng.random() < .85), foto=bool(rng.random() < .8))
            if status == 'dirawat':
                new_visit(tid, b, 'rawat', rand_day(tgl, upd), oleh='pengelola')
    for (alasan, cat, src) in TOLAK:
        b = take('P1'); created = rand_day(date(2027, 4, 5), date(2027, 5, 15))
        new_task(b, 'periksa', 'ditolak', 'regu', tenggat_blok[b], created, created + timedelta(days=1), dibuat='kampus', tolak=(alasan, cat, src))

    # ---- kunjungan awal tanpa tugas, tidak lengkap (blok P1 yang belum siap)
    for b in pools['P1'][:10]:
        new_visit(None, b, 'periksa', rand_day(date(2027, 2, 10), date(2027, 3, 20)), lengkap=False, foto=False)

    con.executemany('INSERT INTO seed_tugas VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', T)
    con.executemany('INSERT INTO seed_kunjungan VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', K)
    A.sort(key=lambda x: x[0])
    con.executemany('INSERT INTO seed_aktivitas VALUES (?,?,?,?,?,?,1)', [(i + 1,) + a for i, a in enumerate(A)])
    con.commit()
    summary(con)
    con.close()


def summary(con):
    """Ringkasan sebaran (definisi siap = PRD §5.3)."""
    d = pd.read_sql("""
      SELECT b.block_id, b.kelas, k.nama AS kab, k.fokus, a.akses,
        (SELECT COUNT(*) FROM seed_kunjungan v WHERE v.block_id=b.block_id AND v.muka_air_cm IS NOT NULL AND v.kondisi_tabat IS NOT NULL) AS lengkap_n,
        (SELECT MIN(v.tanggal) FROM seed_kunjungan v WHERE v.block_id=b.block_id AND v.muka_air_cm IS NOT NULL AND v.kondisi_tabat IS NOT NULL) AS lengkap_tgl,
        (SELECT COUNT(*) FROM seed_tugas t WHERE t.block_id=b.block_id AND t.jenis='periksa' AND t.status='terbukti') AS terbukti
      FROM blocks b JOIN kabupaten k USING(kab_id) JOIN seed_akses a USING(block_id)""", con)
    d['tenggat'] = [(DEADLINE - timedelta(days=LEAD[a] + 7)).isoformat() for a in d.akses]
    d['siap'] = (d.lengkap_n > 0) & (d.lengkap_tgl <= d.tenggat) & (d.terbukti > 0)
    p1 = d[d.kelas == 'P1']
    print(f'Kesiapan P1: {p1.siap.sum()}/{len(p1)} = {100 * p1.siap.mean():.1f}%   P2: {d[d.kelas == "P2"].siap.sum()}/{(d.kelas == "P2").sum()}')
    g = p1.groupby('kab').agg(n_p1=('siap', 'size'), siap=('siap', 'sum')); g['pct'] = (100 * g.siap / g.n_p1).round(1)
    print('Per kabupaten (n_p1 >= 10):'); print(g[g.n_p1 >= 10].sort_values('pct').to_string())
    t = pd.read_sql('SELECT status, COUNT(*) n, SUM(tenggat < ? AND status NOT IN (\'terbukti\')) terlambat FROM seed_tugas GROUP BY status', con, params=(C.AS_OF,))
    print(t.to_string(index=False)); print('Tugas terlambat total:', int(t.terlambat.sum()))
    print(pd.read_sql("SELECT alasan_tolak, COUNT(*) n FROM seed_tugas WHERE status='ditolak' GROUP BY 1", con).to_string(index=False))
    print('kunjungan:', con.execute('SELECT COUNT(*), MAX(tanggal) FROM seed_kunjungan').fetchone(), '| tabat:', con.execute('SELECT COUNT(*) FROM seed_tabat').fetchone()[0],
          '| aktivitas:', con.execute('SELECT COUNT(*) FROM seed_aktivitas').fetchone()[0])


if __name__ == '__main__':
    main()
