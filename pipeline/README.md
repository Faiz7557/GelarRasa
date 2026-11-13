# Pipeline TABAT

Jalankan dari `tabat-app/` (Python 3.13: pandas, numpy, geopandas, shapely 2, rasterio):

```
/c/Python313/python.exe pipeline/build_db.py      # app/data/tabat.db + app/public/geo/*.geojson (+ indonesia-inset.svg; blocks memuat t,y) (idempoten, hapus DB lama; ~40 detik)
/c/Python313/python.exe pipeline/seed_demo.py     # tabel seed_* (DEMO FIKTIF, seed 2026); cetak ringkasan sebaran
/c/Python313/python.exe pipeline/check_numbers.py # gate angka; exit 0 = lulus, 1 = gagal (bisa diberi path DB lain)
```

- Sumber: `../Paket_Riset_Karhutla_Berulang` (CSV Bab III, raster 2015-2024, batas gambut, GWIS) dan `pipeline/data_ext/gadm41_IDN_2.json` (GADM level 2).
- `build_db.py` menghapus DB lama, jadi selalu jalankan `seed_demo.py` sesudahnya.
- Parameter cerita demo (laju kesiapan per kabupaten) ada di `seed_demo.py` (`RATE`); angka riset tidak pernah diubah di sana.
- Konstanta (`AS_OF`, `DEADLINE`, `SEED`, path) di `config.py`.
