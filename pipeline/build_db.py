"""Bangun app/data/tabat.db + app/public/geo/*.geojson dari paket riset (02 §4.1). Idempoten.
Jalankan dari tabat-app/: /c/Python313/python.exe pipeline/build_db.py
"""
import calendar, json, re, sqlite3, sys
from datetime import datetime, timezone
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import rasterio
import shapely
from shapely.geometry import box, mapping

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C

sys.path.insert(0, str(C.RISET))
from analysis_core import _mask_from_geojson  # noqa: E402

B = C.BLOCK


NAMA_RESMI = {'Banjar Baru': 'Banjarbaru', 'Kota Baru': 'Kotabaru'}  # ejaan resmi Kemendagri


def spasi(s):
    """'PulangPisau' -> 'Pulang Pisau'."""
    n = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', s)
    return NAMA_RESMI.get(n, n)


# ---------- langkah 1-2: raster -> P, NV, mask (aturan QA = annual() di build_figma_svg.py) ----------
def load_rasters():
    mask = None; P = []; NV = []
    for y in C.YEARS:
        with rasterio.open(C.RISET / f'data/rasters/kalimantan_selatan_{y}.tif') as ds:
            a = ds.read(masked=True); tr, crs, shape = ds.transform, ds.crs, ds.shape
        if mask is None:
            mask = _mask_from_geojson(C.RISET / 'data/boundaries/peat_kalimantan_selatan.geojson', shape, tr, crs)
        ok = ~np.ma.getmaskarray(a); v = np.ma.filled(a, -9999).astype(np.int16)
        b, q = v[0::2], v[1::2]; ok = ok[0::2] & ok[1::2]
        vv = (ok & (q >= 0) & (b >= 0) & (b <= (366 if calendar.isleap(y) else 365))
              & ((q & 1) == 1) & ((q & 2) == 2) & ((q & 4) == 0) & (((q >> 5) & 7) == 0))
        P.append(((b > 0) & vv).any(0)); NV.append(vv.sum(0, dtype=np.uint8))
        del a, v, b, q, ok, vv
    return mask, np.stack(P), np.stack(NV), tr, crs


def annual(P, mask, tr):
    cell = abs(tr.a * tr.e) / 1e4
    ann = pd.Series([(P[i] & mask).sum() * cell for i in range(10)], index=C.YEARS)
    uniq = (mask & ((P & mask).sum(0) >= 1)).sum() * cell
    assert round(ann.sum()) == 688045 and round(uniq) == 512927, (ann.sum(), uniq)
    return ann, uniq, cell


def kelas_of(tipe, hot):
    return 'P1' if tipe == 3 and hot else 'P2' if tipe == 3 else 'CEK' if tipe == 2 else 'PANTAU' if tipe == 1 else 'LAIN'


def rnd(c, nd):
    return [round(x, nd) for x in c] if isinstance(c[0], (int, float)) else [rnd(x, nd) for x in c]


def write_gj(name, geoms, props, nd):
    feats = []
    for g, p in zip(geoms, props):
        m = mapping(g)
        feats.append({'type': 'Feature', 'properties': p, 'geometry': {'type': m['type'], 'coordinates': rnd(m['coordinates'], nd)}})
    path = C.GEO_DIR / f'{name}.geojson'
    path.write_text(json.dumps({'type': 'FeatureCollection', 'features': feats}, separators=(',', ':'), ensure_ascii=False), encoding='utf-8')
    return path


SCHEMA = """
CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE kabupaten(kab_id TEXT PRIMARY KEY, nama TEXT, provinsi TEXT, fokus INTEGER, lon REAL, lat REAL, n_blok INTEGER, n_p1 INTEGER, n_p2 INTEGER, n_cek INTEGER);
CREATE TABLE blocks(block_id INTEGER PRIMARY KEY, row INTEGER, col INTEGER, lon REAL, lat REAL, kab_id TEXT REFERENCES kabupaten(kab_id),
  mask_cells INTEGER, tipe INTEGER, hotspot INTEGER, kelas TEXT, rank_in_kelas INTEGER, rank_global INTEGER, ever_pct REAL, repeated_pct REAL,
  repeated_cells INTEGER, repeated_ha REAL, mean_years REAL, max_years INTEGER, elnino_pct REAL, last_year INTEGER, full_obs_years REAL,
  gi_z REAL, gi_q REAL, lisa_hh INTEGER);
CREATE INDEX ix_blocks_kelas ON blocks(kelas, rank_in_kelas);
CREATE INDEX ix_blocks_kab ON blocks(kab_id);
CREATE INDEX ix_blocks_rank ON blocks(rank_global);
CREATE TABLE block_years(block_id INTEGER REFERENCES blocks(block_id), tahun INTEGER, pos_cells INTEGER, obs_full_cells INTEGER, PRIMARY KEY(block_id, tahun));
CREATE TABLE replay(skenario TEXT PRIMARY KEY, label TEXT, blok INTEGER, pct_blok REAL, pct_tangkap_2023 REAL);
CREATE TABLE replay_block(block_id INTEGER PRIMARY KEY, rep_cells_2015_22 INTEGER, rank_2015_22 INTEGER, pos_2023_cells INTEGER);
CREATE TABLE replay_curve(n_blok INTEGER PRIMARY KEY, pct_blok REAL, pct_tangkap REAL, pct_acak REAL);
CREATE TABLE coverage_curve(n_blok INTEGER PRIMARY KEY, pct_blok REAL, pct_luas_berulang REAL);
CREATE TABLE facts(key TEXT PRIMARY KEY, value REAL, unit TEXT, label TEXT, sumber TEXT);
CREATE TABLE annual(tahun INTEGER PRIMARY KEY, jendela_ha REAL, el_nino INTEGER);
CREATE TABLE season_monthly(bulan INTEGER PRIMARY KEY, pct REAL);
CREATE TABLE external_facts(key TEXT PRIMARY KEY, persen REAL, ukuran TEXT, sumber TEXT, tautan TEXT, status TEXT, fitur TEXT);
"""


def _svg_path(g, sx, x0, y1):
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    d = []
    for pg in polys:
        for ring in [pg.exterior, *pg.interiors]:
            pts = [f'{(x - x0) * sx:.1f},{(y1 - y) * sx:.1f}' for x, y in ring.coords]
            d.append('M' + 'L'.join(pts) + 'Z')
    return ''.join(d)


def write_indonesia(win):
    """indonesia.geojson (dissolve GADM L1, buang < 50 km2) + indonesia-inset.svg (360x140)."""
    g1 = gpd.read_file(C.RISET / 'data/boundaries/gadm41_IDN_1.json')[['NAME_1', 'geometry']]
    parts = gpd.GeoDataFrame(geometry=list(g1.dissolve().geometry.iloc[0].geoms) if g1.dissolve().geometry.iloc[0].geom_type == 'MultiPolygon' else [g1.dissolve().geometry.iloc[0]], crs=g1.crs)
    parts = parts[parts.to_crs(6933).area / 1e6 >= 50]  # buang pulau < 50 km2
    idn = shapely.MultiPolygon(list(parts.geometry))
    write_gj('indonesia', [idn.simplify(0.03)], [{'nama': 'Indonesia'}], 3)
    # inset: equirectangular satu skala, bbox Indonesia -> 360x140 (dipusatkan)
    sg = shapely.MultiPolygon([q for q in idn.geoms if q.area > 0.1]).simplify(0.15); x0, y0, x1, y1 = sg.bounds
    sx = min(360 / (x1 - x0), 140 / (y1 - y0)); ox = (360 - (x1 - x0) * sx) / 2; oy = (140 - (y1 - y0) * sx) / 2
    fo = g1[g1.NAME_1.isin(C.FOKUS_PROV)].dissolve().geometry.iloc[0].simplify(0.15)
    X = lambda x: (x - x0) * sx + ox; Y = lambda y: (y1 - y) * sx + oy
    wx0, wy0, wx1, wy1 = win.bounds
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" fill="none">'
           f'<path id="idn" fill="currentColor" fill-rule="evenodd" d="{_svg_path(sg, sx, x0, y1)}" transform="translate({ox:.1f} {oy:.1f})"/>'
           f'<path id="fokus" fill="currentColor" fill-rule="evenodd" d="{_svg_path(fo, sx, x0, y1)}" transform="translate({ox:.1f} {oy:.1f})"/>'
           f'<rect id="jendela" x="{X(wx0):.1f}" y="{Y(wy1):.1f}" width="{(wx1 - wx0) * sx:.1f}" height="{(wy1 - wy0) * sx:.1f}" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>'
           f'</svg>')
    (C.GEO_DIR / 'indonesia-inset.svg').write_text(svg, encoding='utf-8')


def main():
    C.GEO_DIR.mkdir(parents=True, exist_ok=True); C.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    mask, P, NV, tr, crs = load_rasters()
    H, W = mask.shape; hb, wb = H // B, W // B
    ann, uniq, cell = annual(P, mask, tr)
    agg = lambda a: a[:hb * B, :wb * B].reshape(hb, B, wb, B).sum((1, 3))

    # ---- blocks
    F = pd.read_csv(C.B3 / 'panel2_blok_lengkap.csv')
    F['hotspot'] = F.hotspot.astype(bool)
    F['kelas'] = [kelas_of(t, h) for t, h in zip(F.tipe, F.hotspot)]
    F['repeated_ha'] = F.repeated_cells * cell
    # urutan PRD 5.2: repeated_cells desc, last_year desc, gi_z desc (NaN terakhir), block_id asc
    F['_gz'] = F.gi_z.fillna(-np.inf)
    F['_ko'] = F.kelas.map({k: i for i, k in enumerate(C.KELAS_ORDER)})
    F = F.sort_values(['_ko', 'repeated_cells', 'last_year', '_gz', 'block_id'], ascending=[True, False, False, False, True]).reset_index(drop=True)
    F['rank_in_kelas'] = F.groupby('kelas').cumcount() + 1
    F['rank_global'] = np.arange(1, len(F) + 1)
    F = F.sort_values('block_id').reset_index(drop=True)
    r, c = F.row.to_numpy(), F.col.to_numpy()

    xs = tr.c + np.arange(wb + 1) * B * tr.a; ys = tr.f + np.arange(hb + 1) * B * tr.e
    geo = gpd.GeoSeries(shapely.box(xs[c], ys[r + 1], xs[c + 1], ys[r]), crs=crs).to_crs(4326)
    cen = geo.centroid; F['lon'] = cen.x.to_numpy(); F['lat'] = cen.y.to_numpy()

    # ---- block_years
    by = []
    for i, y in enumerate(C.YEARS):
        pos = agg((P[i] & mask).astype(int))[r, c]; full = agg(((NV[i] == 12) & mask).astype(int))[r, c]
        by.append(pd.DataFrame({'block_id': F.block_id, 'tahun': y, 'pos_cells': pos, 'obs_full_cells': full}))
    BY = pd.concat(by, ignore_index=True)

    # ---- kabupaten (GADM L2): centroid blok -> kabupaten; di luar poligon -> terdekat
    g2 = gpd.read_file(C.GADM2)[['GID_2', 'NAME_1', 'NAME_2', 'TYPE_2', 'geometry']]
    pts = gpd.GeoDataFrame({'block_id': F.block_id}, geometry=gpd.points_from_xy(F.lon, F.lat), crs=4326)
    j = gpd.sjoin(pts, g2[['GID_2', 'geometry']], how='left', predicate='within').drop_duplicates('block_id').set_index('block_id')
    miss = j.index[j.GID_2.isna()]
    if len(miss):
        nn = gpd.sjoin_nearest(pts[pts.block_id.isin(miss)].to_crs(3857), g2[['GID_2', 'geometry']].to_crs(3857), how='left').drop_duplicates('block_id').set_index('block_id')
        j.loc[miss, 'GID_2'] = nn.GID_2
    F['kab_id'] = F.block_id.map(j.GID_2)
    print(f'blok di luar poligon kabupaten (dipetakan ke terdekat): {len(miss)}')
    g2['fokus'] = g2.NAME_1.isin(C.FOKUS_PROV).astype(int)
    keep = g2[(g2.fokus == 1) | g2.GID_2.isin(F.kab_id)].copy()
    keep['nama'] = [('Kota ' if t == 'Kota' else '') + spasi(n) for n, t in zip(keep.NAME_2, keep.TYPE_2)]
    keep['provinsi'] = keep.NAME_1.map(spasi)
    rp = keep.geometry.representative_point()
    K = pd.DataFrame({'kab_id': keep.GID_2, 'nama': keep.nama, 'provinsi': keep.provinsi, 'fokus': keep.fokus, 'lon': rp.x, 'lat': rp.y})
    cnt = F.groupby('kab_id').agg(n_blok=('block_id', 'size'), n_p1=('kelas', lambda s: (s == 'P1').sum()),
                                  n_p2=('kelas', lambda s: (s == 'P2').sum()), n_cek=('kelas', lambda s: (s == 'CEK').sum()))
    K = K.merge(cnt, left_on='kab_id', right_index=True, how='left').fillna({'n_blok': 0, 'n_p1': 0, 'n_p2': 0, 'n_cek': 0})
    for k in ('n_blok', 'n_p1', 'n_p2', 'n_cek'):
        K[k] = K[k].astype(int)

    # ---- replay (adaptasi replay_2023.py) + kurva
    Pm = P & mask  # replay_2023.py memakai P & mask
    n_tr = Pm[:8].sum(0)
    rep_tr = agg((n_tr >= 2).astype(int))[r, c]; ever_tr = agg((n_tr >= 1).astype(int))[r, c]
    y23 = agg(Pm[8].astype(int))[r, c]; tot23 = y23.sum(); N = len(F)
    pt = lambda s: round(100 * y23[s].sum() / tot23, 1)
    RP = []

    def rep(key, label, sel):
        RP.append((key, label, int(sel.sum()), round(100 * sel.mean(), 1), pt(sel)))
    rep('berulang_2015_22', 'blok berulang 2015-22 (>=1 sel)', rep_tr > 0)
    rep('pernah_2015_22', 'blok pernah berjejak 2015-22', ever_tr > 0)
    rep('acak', 'acak setara (ekspektasi)', np.random.default_rng(1).random(N) < (rep_tr > 0).mean())
    score = rep_tr * 100 + ever_tr
    order = np.argsort(-score)
    for key, frac in (('top5', 0.05), ('top10', 0.10)):
        s = np.zeros(N, bool); s[order[:int(N * frac)]] = True
        rep(key, f'top {int(frac * 100)}% blok skor riwayat 2015-22', s)
    RB = pd.DataFrame({'block_id': F.block_id, 'rep_cells_2015_22': rep_tr, 'pos_2023_cells': y23})
    RB['rank_2015_22'] = np.argsort(np.lexsort((F.block_id.to_numpy(), -rep_tr))) + 1  # 1 = paling berulang
    RC = []
    for n in range(25, 1001, 25):
        s = np.zeros(N, bool); s[order[:n]] = True
        RC.append((n, round(100 * n / N, 2), pt(s), round(100 * n / N, 2)))
    # kurva cakupan: urutan rank_global (PRD 5.2) -> % luas berulang 2015-2024
    byg = F.sort_values('rank_global'); cum = byg.repeated_cells.cumsum().to_numpy(); totrep = F.repeated_cells.sum()
    n_tipe = int((F.tipe > 0).sum())
    ns = sorted(set(list(range(25, n_tipe + 1, 25)) + [n_tipe]))
    CC = [(n, round(100 * n / N, 2), round(100 * cum[n - 1] / totrep, 2)) for n in ns]

    # ---- konteks
    reg = pd.read_csv(C.B3 / 'registri_angka_bab3.csv', dtype=str).set_index('kunci')
    prof = pd.read_csv(C.B3 / 'panel2_profil_tipe.csv').set_index('tipe')
    num = lambda k: float(reg.loc[k, 'nilai'])
    tah, uni = [float(x.strip().replace('.', '')) for x in reg.loc['jumlah_tahunan_vs_unik', 'nilai'].split('vs')]
    assert round(tah) == round(ann.sum()) and round(uni) == round(uniq)
    hot = F.hotspot
    pb = round(100 * hot.mean(), 1); pl = round(100 * F.loc[hot, 'repeated_cells'].sum() / F.repeated_cells.sum(), 1)
    src = 'registri_angka_bab3.csv'
    FACTS = [
        ('agu_okt_pct', num('porsi_agu_okt_gwis'), '%', 'Luas terbakar Agu–Okt (GWIS Kalsel+Kalteng 2015–2024)', f'{src}:porsi_agu_okt_gwis'),
        ('moran_I', num('moran_I_blok5'), 'I', "Moran's I blok 5×5", f'{src}:moran_I_blok5'),
        ('rasio_acak', num('rasio_vs_acak'), 'kali', 'Pengelompokan dibanding acak', f'{src}:rasio_vs_acak'),
        ('p_toroidal', float(re.search(r'p toroidal = ([\d.]+)', reg.loc['rasio_vs_acak', 'catatan']).group(1)), 'p', 'Uji toroidal (999 permutasi)', f'{src}:rasio_vs_acak (catatan)'),
        ('hotspot_blok', num('blok_hotspot'), 'blok', 'Blok hotspot (Gi*, q < 0,05)', f'{src}:blok_hotspot'),
        ('hotspot_pct_blok', pb, '%', 'Hotspot dari seluruh blok', f'dihitung dari panel2_blok_lengkap.csv; registri {src}:blok_hotspot'),
        ('hotspot_pct_luas', num('pct_luas_berulang_di_hotspot'), '%', 'Luas berulang yang berada di hotspot', f'{src}:pct_luas_berulang_di_hotspot'),
        ('el_nino_pct', num('porsi_el_nino_jendela'), '%', 'Porsi luas bukti positif pada tahun El Niño', f'{src}:porsi_el_nino_jendela'),
        ('el_nino_rasio', num('rasio_el_nino_vs_lain'), 'kali', 'Tahun El Niño vs tahun lain', f'{src}:rasio_el_nino_vs_lain'),
        ('jumlah_tahunan_ha', tah, 'ha', 'Jumlah luas bukti positif tahunan 2015–2024', f'{src}:jumlah_tahunan_vs_unik'),
        ('luas_unik_ha', uni, 'ha', 'Luas unik pernah berjejak 2015–2024', f'{src}:jumlah_tahunan_vs_unik'),
        ('silhouette', num('silhouette'), 'I', 'Silhouette pengelompokan tipe (k=3)', f'{src}:silhouette'),
        ('tipe3_full_obs_median', float(prof.loc[3, 'full_obs_years_median']), 'tahun', 'Median tahun teramati lengkap, tipe 3', 'panel2_profil_tipe.csv:full_obs_years_median'),
        ('agu_okt_jendela_pct', num('porsi_agu_okt_jendela'), '%', 'Luas bukti positif Agu–Okt di jendela studi', f'{src}:porsi_agu_okt_jendela'),
    ] + [(f'annual_window_ha_{y}', float(ann[y]), 'ha', f'Luas bukti positif jendela studi {y}', 'build_figma_svg.py annual()') for y in C.YEARS]
    assert pb == 8.2 and pl == 77.8 and int(hot.sum()) == 462

    gw = pd.read_csv(C.RISET / 'data/raw/gwis_indonesia_monthly_2002_2025.csv')
    ks = gw[gw.region.isin(['Kalimantan Selatan', 'Kalimantan Tengah']) & gw.year.between(2015, 2024)]
    mon = ks.groupby('month').burned_area_ha.sum(); mon_pct = 100 * mon / mon.sum()
    assert round(mon_pct[[8, 9, 10]].sum(), 1) == 95.5
    ext = pd.read_csv(C.B3 / 'panel3_sorotan_eksternal.csv')
    EK = {'Peta Riwayat': 'riwayat_38', 'Kartu Lokasi': 'air_60', 'Tugas Terarah + Bukti Tindak Lanjut': 'sekat_70'}
    EXT = [(EK[x.fitur_TAPAK], float(x.persen), x.ukuran, x.sumber, x.tautan, 'cek laporan asli', x.fitur_TAPAK) for x in ext.itertuples()]

    # ---- tulis DB
    if C.DB_PATH.exists():
        C.DB_PATH.unlink()
    con = sqlite3.connect(C.DB_PATH)
    con.executescript(SCHEMA)
    ins = lambda t, rows, n: con.executemany(f'INSERT INTO {t} VALUES ({",".join("?" * n)})', rows)
    clean = lambda d: d.astype(object).where(d.notna(), None).values.tolist()
    ins('meta', [('as_of', C.AS_OF), ('deadline', C.DEADLINE), ('data_window', '2015-2024 · MODIS MCD64A1 h29v09 · gambut BIG'), ('cell_ha', f'{cell:.6f}'),
                 ('block_ha', f'{cell * B * B:.4f}'), ('version', '1.0'), ('built_at', datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))], 2)
    ins('kabupaten', clean(K), 10)
    cols = ['block_id', 'row', 'col', 'lon', 'lat', 'kab_id', 'mask_cells', 'tipe', 'hotspot', 'kelas', 'rank_in_kelas', 'rank_global', 'ever_pct', 'repeated_pct',
            'repeated_cells', 'repeated_ha', 'mean_years', 'max_years', 'elnino_pct', 'last_year', 'full_obs_years', 'gi_z', 'gi_q', 'lisa_HH']
    Fo = F[cols].copy(); Fo['hotspot'] = Fo.hotspot.astype(int); Fo['lisa_HH'] = Fo.lisa_HH.astype(int)
    ins('blocks', clean(Fo), len(cols))
    ins('block_years', BY.values.tolist(), 4)
    ins('replay', RP, 5); ins('replay_block', RB[['block_id', 'rep_cells_2015_22', 'rank_2015_22', 'pos_2023_cells']].values.tolist(), 4)
    ins('replay_curve', RC, 4); ins('coverage_curve', CC, 3); ins('facts', FACTS, 5)
    ins('annual', [(y, float(ann[y]), int(y in C.ELNINO)) for y in C.YEARS], 3)
    ins('season_monthly', [(int(m), float(v)) for m, v in mon_pct.items()], 2); ins('external_facts', EXT, 7)
    con.commit(); con.close()

    # ---- GeoJSON (langkah 5)
    # t = jumlah tahun berjejak (0-10); y = bitmask, bit i = tahun 2015+i berjejak (untuk 3D)
    posm = BY.assign(b=(BY.pos_cells > 0).astype(int) * 2 ** (BY.tahun - 2015)).groupby('block_id').b.sum()
    tcnt = BY.assign(b=(BY.pos_cells > 0).astype(int)).groupby('block_id').b.sum()
    p_bl = write_gj('blocks', geo, [{'id': int(i), 't': int(tcnt[i]), 'y': int(posm[i])} for i in F.block_id], 5)
    tile = gpd.GeoSeries([box(tr.c, tr.f + H * tr.e, tr.c + W * tr.a, tr.f)], crs=crs)
    tile4 = gpd.GeoSeries(shapely.segmentize(tile.iloc[0], 10000), crs=crs).to_crs(4326)
    write_gj('jendela', tile4, [{'nama': 'Jendela studi MODIS h29v09'}], 5)
    gk = keep.set_index('GID_2').loc[K.kab_id]
    write_gj('kabupaten', gk.geometry.simplify(0.002).values, [{'kab_id': a, 'nama': b, 'fokus': int(f)} for a, b, f in zip(K.kab_id, K.nama, K.fokus)], 4)
    g1 = gpd.read_file(C.RISET / 'data/boundaries/gadm41_IDN_1.json')
    g1 = g1[g1.NAME_1.isin(['KalimantanBarat', 'KalimantanSelatan', 'KalimantanTengah', 'KalimantanTimur', 'KalimantanUtara'])]
    write_gj('provinsi', g1.geometry.simplify(0.01).values, [{'nama': spasi(n), 'fokus': int(n in C.FOKUS_PROV)} for n in g1.NAME_1], 4)
    peat = gpd.clip(gpd.read_file(C.RISET / 'data/boundaries/peat_kalimantan_selatan.geojson').to_crs(4326), tile4.iloc[0]).dissolve().simplify(0.003)
    write_gj('gambut', peat.values, [{'nama': 'gambut BIG (klip jendela)'}], 4)
    write_indonesia(tile4.iloc[0])
    sz = p_bl.stat().st_size
    print(f'blocks.geojson {sz / 1e6:.2f} MB; {len(F)} blok; DB {C.DB_PATH.stat().st_size / 1e6:.1f} MB')
    assert sz < 1.5e6, 'blocks.geojson >= 1,5 MB'


if __name__ == '__main__':
    main()
