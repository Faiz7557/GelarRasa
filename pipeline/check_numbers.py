"""Gate angka TABAT (02 §4.3 + sebaran seed + GeoJSON). Exit 0 bila lulus, 1 bila ada yang gagal.
Pakai: python pipeline/check_numbers.py [path_db]
"""
import json, sqlite3, sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C

DB = Path(sys.argv[1]) if len(sys.argv) > 1 else C.DB_PATH
fails, oks = [], 0


def check(nama, cond, detail=''):
    global oks
    if cond:
        oks += 1
    else:
        fails.append(f'GAGAL  {nama}  {detail}')


def eq(nama, got, want):
    check(nama, got == want, f'(didapat {got!r}, seharusnya {want!r})')


def main():
    if not DB.exists():
        sys.exit(f'GAGAL  {DB} tidak ada; jalankan build_db.py dan seed_demo.py dulu')
    con = sqlite3.connect(DB)
    q1 = lambda sql, *a: con.execute(sql, a).fetchone()[0]
    qd = lambda sql, *a: pd.read_sql(sql, con, params=a)

    # ---- blok dan kelas
    eq('count(blocks)', q1('SELECT COUNT(*) FROM blocks'), 5633)
    eq('count(blocks where tipe>0)', q1('SELECT COUNT(*) FROM blocks WHERE tipe>0'), 1841)
    kel = dict(con.execute('SELECT kelas, COUNT(*) FROM blocks GROUP BY 1').fetchall())
    eq('kelas counts', kel, {'P1': 358, 'P2': 166, 'CEK': 119, 'PANTAU': 1198, 'LAIN': 3792})
    nh = q1('SELECT COUNT(*) FROM blocks WHERE hotspot=1')
    eq('count(hotspot)', nh, 462); eq('% hotspot', round(100 * nh / 5633, 1), 8.2)
    eq('% repeated_cells di hotspot', round(100 * q1('SELECT SUM(repeated_cells) FROM blocks WHERE hotspot=1') / q1('SELECT SUM(repeated_cells) FROM blocks'), 1), 77.8)
    eq('blok kab_id NULL', q1('SELECT COUNT(*) FROM blocks WHERE kab_id IS NULL'), 0)
    eq('blok kab_id tanpa baris kabupaten', q1('SELECT COUNT(*) FROM blocks b LEFT JOIN kabupaten k USING(kab_id) WHERE k.kab_id IS NULL'), 0)
    eq('kabupaten.fokus salah', q1("SELECT COUNT(*) FROM kabupaten WHERE fokus != (provinsi IN ('Kalimantan Tengah','Kalimantan Selatan'))"), 0)
    eq('kabupaten.n_blok jumlah', q1('SELECT SUM(n_blok) FROM kabupaten'), 5633)
    eq('kabupaten.n_p1 jumlah', q1('SELECT SUM(n_p1) FROM kabupaten'), 358)
    eq('rank_in_kelas P1 = 1..358', q1("SELECT MIN(rank_in_kelas)||'-'||MAX(rank_in_kelas) FROM blocks WHERE kelas='P1'"), '1-358')
    eq('rank_global unik', q1('SELECT COUNT(DISTINCT rank_global) FROM blocks'), 5633)
    eq('P1 rank 1 = repeated_cells terbesar', q1("SELECT repeated_cells FROM blocks WHERE kelas='P1' AND rank_in_kelas=1"), q1("SELECT MAX(repeated_cells) FROM blocks WHERE kelas='P1'"))

    # ---- replay
    ref = pd.read_csv(C.B3 / 'replay_2023.csv'); db = qd('SELECT * FROM replay')
    keys = ['berulang_2015_22', 'pernah_2015_22', 'acak', 'top5', 'top10']
    eq('replay skenario', sorted(db.skenario), sorted(keys))
    dbi = db.set_index('skenario')
    for k, (_, rr) in zip(keys, ref.iterrows()):
        eq(f'replay {k} blok', int(dbi.loc[k, 'blok']), int(rr.blok))
        eq(f'replay {k} pct_blok', float(dbi.loc[k, 'pct_blok']), float(rr.pct_blok))
        eq(f'replay {k} pct_tangkap_2023', float(dbi.loc[k, 'pct_tangkap_2023']), float(rr.pct_tangkap_2023))
    eq('replay berulang pct_blok/pct_tangkap', (float(dbi.loc['berulang_2015_22', 'pct_blok']), float(dbi.loc['berulang_2015_22', 'pct_tangkap_2023'])), (9.3, 46.2))
    eq('replay acak pct_tangkap', float(dbi.loc['acak', 'pct_tangkap_2023']), 8.9)
    eq('replay_curve baris', q1('SELECT COUNT(*) FROM replay_curve'), 40)
    eq('replay_curve N', qd('SELECT MIN(n_blok) a, MAX(n_blok) b FROM replay_curve').iloc[0].tolist(), [25, 1000])
    eq('coverage_curve N maks', q1('SELECT MAX(n_blok) FROM coverage_curve'), 1841)
    eq('coverage_curve monoton', q1('SELECT COUNT(*) FROM coverage_curve a JOIN coverage_curve b ON b.n_blok>a.n_blok AND b.pct_luas_berulang<a.pct_luas_berulang'), 0)
    eq('replay_block baris', q1('SELECT COUNT(*) FROM replay_block'), 5633)

    # ---- facts dan konteks
    f = dict(con.execute('SELECT key, value FROM facts').fetchall())
    for k in ['agu_okt_pct', 'moran_I', 'rasio_acak', 'p_toroidal', 'hotspot_blok', 'hotspot_pct_blok', 'hotspot_pct_luas', 'el_nino_pct', 'el_nino_rasio',
              'jumlah_tahunan_ha', 'luas_unik_ha', 'silhouette', 'tipe3_full_obs_median']:
        check(f'facts[{k}] ada', k in f)
    eq('facts agu_okt_pct', f.get('agu_okt_pct'), 95.5); eq('facts moran_I', f.get('moran_I'), 0.69); eq('facts rasio_acak', f.get('rasio_acak'), 2.81)
    eq('facts hotspot_blok', f.get('hotspot_blok'), 462.0); eq('facts hotspot_pct_blok', f.get('hotspot_pct_blok'), 8.2); eq('facts hotspot_pct_luas', f.get('hotspot_pct_luas'), 77.8)
    eq('facts jumlah_tahunan_ha', f.get('jumlah_tahunan_ha'), 688045.0); eq('facts luas_unik_ha', f.get('luas_unik_ha'), 512927.0)
    sm = dict(con.execute('SELECT bulan, pct FROM season_monthly').fetchall())
    eq('season_monthly 12 bulan', len(sm), 12); eq('season Agu-Okt', round(sm[8] + sm[9] + sm[10], 1), 95.5)
    check('season total ~100', abs(sum(sm.values()) - 100) < 0.01, f'(jumlah {sum(sm.values())})')
    ek = {r[0]: r for r in con.execute('SELECT key, persen, status FROM external_facts')}
    eq('external_facts kunci', sorted(ek), ['air_60', 'riwayat_38', 'sekat_70'])
    check('external_facts persen', all(round(ek[k][1]) == v for k, v in {'riwayat_38': 38, 'air_60': 60, 'sekat_70': 70}.items() if k in ek))
    check('external_facts status', all(v[2] == 'cek laporan asli' for v in ek.values()))

    # ---- deret tahunan vs block_years (diuji terpisah, tidak dipaksa sama)
    ann = dict(con.execute('SELECT tahun, jendela_ha FROM annual').fetchall())
    check('annual total 688.045 ± 1 ha', abs(sum(ann.values()) - 688045) <= 1, f'(didapat {sum(ann.values()):.2f})')
    for y, v in ann.items():
        check(f'facts annual_window_ha_{y}', abs(f.get(f'annual_window_ha_{y}', -1) - v) < 1e-6)
    eq('block_years baris', q1('SELECT COUNT(*) FROM block_years'), 56330)
    cell = float(q1("SELECT value FROM meta WHERE key='cell_ha'"))
    by = dict(con.execute('SELECT tahun, SUM(pos_cells) FROM block_years GROUP BY tahun').fetchall())
    for y in C.YEARS:
        ha = by[y] * cell
        check(f'block_years {y} <= annual (blok memuat sebagian sel mask)', ha <= ann[y] + 1, f'({ha:.1f} vs {ann[y]:.1f})')
        check(f'block_years {y} >= 85% annual', ha >= 0.85 * ann[y], f'({ha:.1f} vs {ann[y]:.1f})')
    check('block_years obs_full <= mask_cells', q1('SELECT COUNT(*) FROM block_years y JOIN blocks b USING(block_id) WHERE y.obs_full_cells > b.mask_cells OR y.pos_cells > b.mask_cells') == 0)
    check('annual.el_nino', dict(con.execute('SELECT tahun, el_nino FROM annual').fetchall()) == {y: int(y in C.ELNINO) for y in C.YEARS})
    eq('meta as_of/deadline', (q1("SELECT value FROM meta WHERE key='as_of'"), q1("SELECT value FROM meta WHERE key='deadline'")), (C.AS_OF, C.DEADLINE))

    # ---- seed
    tabs = ['seed_akses', 'seed_tabat', 'seed_tugas', 'seed_kunjungan', 'seed_aktivitas']
    for t in tabs:
        n = q1(f'SELECT COUNT(*) FROM {t}')
        check(f'{t} tidak kosong', n > 0)
        eq(f'{t} semua is_demo=1', q1(f'SELECT COUNT(*) FROM {t} WHERE is_demo IS NOT 1'), 0)
    eq('seed_akses hanya P1/P2/CEK', q1("SELECT COUNT(*) FROM seed_akses a JOIN blocks b USING(block_id) WHERE b.kelas NOT IN ('P1','P2','CEK')"), 0)
    eq('seed_akses jumlah', q1('SELECT COUNT(*) FROM seed_akses'), 358 + 166 + 119)
    eq('seed_tabat per blok <= 3', q1('SELECT MAX(c) FROM (SELECT COUNT(*) c FROM seed_tabat GROUP BY block_id)') <= 3, True)
    eq('kunjungan setelah as_of', q1('SELECT COUNT(*) FROM seed_kunjungan WHERE tanggal > ?', C.AS_OF), 0)
    st = dict(con.execute('SELECT status, COUNT(*) FROM seed_tugas GROUP BY 1').fetchall())
    for s in ['usulan', 'disetujui', 'diperiksa', 'dirawat', 'terbukti', 'ditolak']:
        check(f'ada tugas status {s}', st.get(s, 0) > 0)
    # terbukti wajib foto
    eq('tugas terbukti tanpa kunjungan berfoto', q1("SELECT COUNT(*) FROM seed_tugas t WHERE t.status='terbukti' AND NOT EXISTS (SELECT 1 FROM seed_kunjungan v WHERE v.tugas_id=t.tugas_id AND v.foto IS NOT NULL)"), 0)
    late = q1("SELECT COUNT(*) FROM seed_tugas WHERE tenggat < ? AND status NOT IN ('terbukti')", C.AS_OF)
    check('tugas terlambat 8-12', 8 <= late <= 12, f'(didapat {late})')
    rej = qd("SELECT alasan_tolak FROM seed_tugas WHERE status='ditolak'").alasan_tolak
    check('alasan tolak: 5 contoh', len(rej) == 5, f'(didapat {len(rej)})')
    check('alasan tolak: 4 kategori', rej.nunique() == 4, f'(didapat {rej.nunique()})')
    check('alasan tolak valid enum', set(rej) <= {'akses_terputus', 'sudah_dibasahi', 'bukan_gambut', 'di_luar_kewenangan', 'tabat_sudah_baik', 'lainnya'})
    # kesiapan (PRD 5.3): kunjungan lengkap sebelum tenggat + tugas periksa terbukti
    d = qd("""SELECT b.block_id, k.nama kab, k.fokus, a.akses,
        (SELECT MIN(v.tanggal) FROM seed_kunjungan v WHERE v.block_id=b.block_id AND v.muka_air_cm IS NOT NULL AND v.kondisi_tabat IS NOT NULL) lengkap,
        (SELECT COUNT(*) FROM seed_tugas t WHERE t.block_id=b.block_id AND t.jenis='periksa' AND t.status='terbukti') terbukti
        FROM blocks b JOIN kabupaten k USING(kab_id) JOIN seed_akses a USING(block_id) WHERE b.kelas='P1'""")
    lead = {'jalan': 7, 'sungai': 14, 'sulit': 21}
    d['tenggat'] = [(date.fromisoformat(C.DEADLINE) - timedelta(days=lead[a] + 7)).isoformat() for a in d.akses]
    d['siap'] = d.lengkap.notna() & (d.lengkap <= d.tenggat) & (d.terbukti > 0)
    pct = 100 * d.siap.mean()
    check('kesiapan P1 30-40%', 30 <= pct <= 40, f'(didapat {pct:.1f}%)')
    g = d[d.fokus == 1].groupby('kab').agg(n=('siap', 'size'), s=('siap', 'sum'))
    g = g[g.n >= 10]
    check('>=1 kabupaten fokus (>=10 P1) kesiapan < 15%', bool(((100 * g.s / g.n) < 15).any()), f'(kabupaten: {(100 * g.s / g.n).round(1).to_dict()})')

    # ---- GeoJSON
    for nm in ['blocks', 'kabupaten', 'provinsi', 'jendela', 'gambut']:
        p = C.GEO_DIR / f'{nm}.geojson'
        try:
            gj = json.loads(p.read_text(encoding='utf-8')); ok = gj.get('type') == 'FeatureCollection' and len(gj['features']) > 0
        except Exception as e:  # noqa: BLE001
            gj, ok = None, False; fails.append(f'GAGAL  {nm}.geojson tidak terbaca ({e})')
        if gj is not None:
            check(f'{nm}.geojson valid', ok)
            if nm == 'blocks':
                eq('blocks.geojson fitur', len(gj['features']), 5633)
                check('blocks.geojson properti id,t,y', all(list(x['properties']) == ['id', 't', 'y'] for x in gj['features']))
                import random
                fx = {x['properties']['id']: x['properties'] for x in gj['features']}
                for bid in random.Random(2026).sample(sorted(fx), 20):
                    yrs = dict(con.execute('SELECT tahun, pos_cells FROM block_years WHERE block_id=?', (bid,)).fetchall())
                    eq(f'blok {bid} t', fx[bid]['t'], sum(v > 0 for v in yrs.values()))
                    eq(f'blok {bid} y', fx[bid]['y'], sum(1 << (t - 2015) for t, v in yrs.items() if v > 0))
                check('blocks.geojson < 1,5 MB', p.stat().st_size < 1.5e6, f'({p.stat().st_size} byte)')

    # ---- Indonesia
    try:
        pi = C.GEO_DIR / 'indonesia.geojson'; gi = json.loads(pi.read_text(encoding='utf-8'))
        check('indonesia.geojson valid (1 MultiPolygon)', gi['type'] == 'FeatureCollection' and len(gi['features']) == 1 and gi['features'][0]['geometry']['type'] == 'MultiPolygon')
        check('indonesia.geojson < 150 KB', pi.stat().st_size < 150_000, f'({pi.stat().st_size} byte)')
        sv = (C.GEO_DIR / 'indonesia-inset.svg').read_text(encoding='utf-8')
        for i in ('idn', 'fokus', 'jendela'):
            check(f'inset svg memuat id="{i}"', f'id="{i}"' in sv)
        check('inset svg viewBox 360x140', 'viewBox="0 0 360 140"' in sv)
    except Exception as e:  # noqa: BLE001
        fails.append(f'GAGAL  indonesia geo tidak terbaca ({e})')

    print(f'{oks} cek lulus, {len(fails)} gagal')
    for x in fails:
        print(x)
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
