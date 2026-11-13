# 05 · Backend Schema TABAT

Turunan dari [02_TRD](02_TRD.md). Dua database SQLite:

| DB | Lokasi runtime | Mode | Dibuat oleh |
|---|---|---|---|
| **Analitik** `tabat.db` | `app/data/tabat.db` (dibundel) | read-only | `pipeline/build_db.py` + `pipeline/seed_demo.py` |
| **Operasional** `tabat-ops.sqlite` | `/tmp` (Vercel) atau `os.tmpdir()` (lokal) | read-write | `app/lib/ops.ts` saat cold start, menyalin dari tabel `seed_*` |

Konvensi: nama tabel dan kolom `snake_case`, Bahasa Indonesia untuk domain, Inggris untuk teknis (`id`, `created_at`). Tanggal ISO `YYYY-MM-DD`; waktu ISO 8601 UTC. Boolean `INTEGER 0/1`. Luas dalam hektare (`REAL`).

## 1. Diagram relasi

```
kabupaten 1──* blocks 1──* block_years
                 │
                 ├──1 seed_akses
                 ├──* seed_tabat
                 ├──1 replay_block
                 └──* (ops) tugas 1──* (ops) kunjungan
                              └──* (ops) aktivitas
Tabel lepas: meta, facts, annual, season_monthly, external_facts, replay, replay_curve, coverage_curve
```

## 2. DB analitik (`tabat.db`)

### 2.1 `meta`

| Kolom | Tipe | Isi |
|---|---|---|
| `key` | TEXT PK | `as_of`, `deadline`, `data_window`, `cell_ha`, `block_ha`, `version`, `built_at` |
| `value` | TEXT | — |

### 2.2 `kabupaten`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `kab_id` | TEXT PK | `GID_2` GADM 4.1 |
| `nama` | TEXT | dengan spasi, mis. "Pulang Pisau" (GADM menulis tanpa spasi; pipeline menyisipkan spasi) |
| `provinsi` | TEXT | "Kalimantan Tengah" / "Kalimantan Selatan" / provinsi tetangga |
| `fokus` | INTEGER | 1 bila Kalteng atau Kalsel |
| `lon`, `lat` | REAL | titik label (representative point) |
| `n_blok`, `n_p1`, `n_p2`, `n_cek` | INTEGER | turunan, untuk label peta |

### 2.3 `blocks` (5.633 baris)

| Kolom | Tipe | Dari | Keterangan |
|---|---|---|---|
| `block_id` | INTEGER PK | csv | |
| `row`, `col` | INTEGER | csv | indeks grid blok 5×5 sel |
| `lon`, `lat` | REAL | pipeline | centroid WGS84 |
| `kab_id` | TEXT FK | pipeline | → `kabupaten` |
| `mask_cells` | INTEGER | csv | sel gambut dalam blok |
| `tipe` | INTEGER | csv | 0–3 |
| `hotspot` | INTEGER | csv | Gi* FDR q < 0,05 |
| `kelas` | TEXT | pipeline | `P1`/`P2`/`CEK`/`PANTAU`/`LAIN` |
| `rank_in_kelas`, `rank_global` | INTEGER | pipeline | urutan PRD §5.2 |
| `ever_pct`, `repeated_pct` | REAL | csv | % sel |
| `repeated_cells` | INTEGER | csv | |
| `repeated_ha` | REAL | pipeline | `repeated_cells × cell_ha` |
| `mean_years` | REAL | csv | |
| `max_years` | INTEGER | csv | |
| `elnino_pct` | REAL | csv | |
| `last_year` | INTEGER | csv | 0 bila tanpa jejak |
| `full_obs_years` | REAL | csv | rata-rata tahun teramati lengkap |
| `gi_z`, `gi_q` | REAL | csv | boleh NULL |
| `lisa_hh` | INTEGER | csv | |

Indeks: `(kelas, rank_in_kelas)`, `(kab_id)`, `(rank_global)`.

### 2.4 `block_years` (5.633 × 10 baris)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `block_id` | INTEGER FK | |
| `tahun` | INTEGER | 2015–2024 |
| `pos_cells` | INTEGER | sel bukti positif tahun itu |
| `obs_full_cells` | INTEGER | sel dengan 12 bulan teramati valid |

PK (`block_id`, `tahun`).

### 2.5 `replay`, `replay_block`, `replay_curve`

`replay`: `skenario TEXT PK` (`berulang_2015_22`, `acak`, `top5`, `top10`, `pernah_2015_22`), `label TEXT`, `blok INTEGER`, `pct_blok REAL`, `pct_tangkap_2023 REAL`. Wajib sama dengan `Paket_Riset…/outputs/bab3/replay_2023.csv` (9,3 / 46,2; acak 9,3 / 8,9).

`replay_block`: `block_id INTEGER PK`, `rep_cells_2015_22 INTEGER`, `rank_2015_22 INTEGER`, `pos_2023_cells INTEGER`. Untuk animasi `/bukti`.

`replay_curve`: `n_blok INTEGER PK` (25, 50, …, 1.000), `pct_blok REAL`, `pct_tangkap REAL`, `pct_acak REAL` (= `pct_blok`).

### 2.6 `coverage_curve`

`n_blok INTEGER PK` (25, 50, …, 1.841), `pct_blok REAL`, `pct_luas_berulang REAL`. Urutan blok mengikuti PRD §5.2. Dipakai slider kapasitas di `/peta`.

### 2.7 `facts`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `key` | TEXT PK | `agu_okt_pct`, `moran_I`, `rasio_acak`, `p_toroidal`, `hotspot_blok`, `hotspot_pct_blok`, `hotspot_pct_luas`, `el_nino_pct`, `el_nino_rasio`, `jumlah_tahunan_ha`, `luas_unik_ha`, `silhouette`, `tipe3_full_obs_median` |
| `value` | REAL | |
| `unit` | TEXT | `%`, `ha`, `kali`, `I`, `p`, `tahun` |
| `label` | TEXT | kalimat UI pendek |
| `sumber` | TEXT | file + kunci registri |

### 2.8 Konteks

- `annual`: `tahun INTEGER PK`, `jendela_ha REAL`, `el_nino INTEGER`.
- `season_monthly`: `bulan INTEGER PK`, `pct REAL` (GWIS Kalsel+Kalteng 2015–2024).
- `external_facts`: `key TEXT PK` (`riwayat_38`, `air_60`, `sekat_70`), `persen REAL`, `ukuran TEXT`, `sumber TEXT`, `tautan TEXT`, `status TEXT`, `fitur TEXT`.

## 3. Data demo (tabel `seed_*` di `tabat.db`, semua `is_demo = 1`)

### 3.1 `seed_akses`

`block_id INTEGER PK`, `akses TEXT` (`jalan`/`sungai`/`sulit`), `is_demo INTEGER`. Hanya kelas P1, P2, CEK. Sebaran deterministik: 50% jalan, 35% sungai, 15% sulit.

### 3.2 `seed_tabat`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `tabat_id` | TEXT PK | `TB-<block_id>-<n>` |
| `block_id` | INTEGER FK | |
| `lon`, `lat` | REAL | acak di dalam blok |
| `bahan` | TEXT | `kayu`, `karung_tanah`, `beton` |
| `kondisi_awal` | TEXT | `baik`, `rembes`, `rusak`, `jebol` |
| `is_demo` | INTEGER | 1 |

0–3 tabat per blok P1/P2.

### 3.3 `seed_tugas`, `seed_kunjungan`, `seed_aktivitas`

Kolom sama dengan tabel ops §4, ditambah `is_demo = 1`. Dibuat dengan `numpy.random.default_rng(2026)` dan target sebaran di 02 §4.2.

### 3.4 Persona (di kode, bukan DB)

`app/lib/people.ts`: `koordinator`, `regu`, `pengelola`, `kampus`, dengan `nama`, `jabatan`, `login`, `wa` (nomor fiktif `62800000000x`).

## 4. DB operasional (`tabat-ops.sqlite`)

### 4.1 `tugas`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `tugas_id` | TEXT PK | `T-<6 digit>` |
| `block_id` | INTEGER | |
| `jenis` | TEXT | `periksa` (Telusuri+Amati) · `rawat_tabat` (Aksi) · `basahi` (Aksi) · `verifikasi` (Tuntaskan) |
| `status` | TEXT | `usulan` → `disetujui` → `diperiksa` → `dirawat` → `terbukti`, atau `ditolak` |
| `pemilik` | TEXT | persona id |
| `tenggat` | TEXT | tanggal |
| `alasan_tolak` | TEXT | enum PRD §5.6, NULL bila tidak ditolak |
| `catatan_tolak` | TEXT | teks bebas |
| `alasan_sumber` | TEXT | `pilih` / `ai` / `kata_kunci` |
| `dibuat_oleh` | TEXT | persona |
| `created_at`, `updated_at` | TEXT | |
| `is_demo` | INTEGER | 1 untuk baris seed, 0 untuk baris buatan sesi |

Aturan transisi (ditegakkan di `PATCH /api/tugas/[id]`):

| Dari → Ke | Siapa |
|---|---|
| `usulan` → `disetujui` / `ditolak` | koordinator |
| `disetujui` → `diperiksa` | otomatis saat kunjungan `periksa` tersimpan (regu) |
| `diperiksa` → `dirawat` | otomatis saat kunjungan `rawat` tersimpan (pengelola) atau koordinator |
| `diperiksa` / `dirawat` → `terbukti` | koordinator atau kampus; wajib ada ≥ 1 kunjungan berfoto |
| apa pun → `usulan` | koordinator (buka ulang) |

### 4.2 `kunjungan`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `kunjungan_id` | TEXT PK | |
| `client_id` | TEXT UNIQUE | UUID dari ponsel (idempoten) |
| `tugas_id` | TEXT FK | boleh NULL |
| `block_id` | INTEGER | |
| `jenis` | TEXT | `periksa` / `rawat` |
| `tanggal` | TEXT | |
| `muka_air_cm` | INTEGER | 0–200, NULL bila tidak diukur |
| `tabat_id` | TEXT | boleh NULL |
| `kondisi_tabat` | TEXT | `baik`/`rembes`/`rusak`/`jebol`/`tidak_ada` |
| `akses_aktual` | TEXT | `jalan`/`sungai`/`sulit`/`tidak_bisa` |
| `foto` | TEXT | data URL JPEG ≤ 150 KB, boleh NULL |
| `lon`, `lat` | REAL | |
| `koordinat_sumber` | TEXT | `gps` / `centroid` |
| `catatan` | TEXT | ≤ 500 karakter |
| `oleh` | TEXT | persona |
| `created_at` | TEXT | |
| `is_demo` | INTEGER | |

### 4.3 `aktivitas`

`id INTEGER PK`, `waktu TEXT`, `persona TEXT`, `aksi TEXT` (`setujui`, `tolak`, `kunjungan`, `bukti`, `reset`), `ref TEXT`, `ringkas TEXT`. Untuk linimasa di Kartu Lokasi dan Cek Data.

## 5. Query inti

`lib/ops.ts` membuka ops DB lalu `ATTACH` `tabat.db` sebagai skema `ana` (mode `?mode=ro`), sehingga join cukup satu koneksi.

```sql
-- Bahan kesiapan: blok wajib + kunjungan lengkap + tugas periksa terbukti
SELECT b.block_id, b.kab_id, b.kelas, b.rank_in_kelas, a.akses,
       MAX(CASE WHEN k.muka_air_cm IS NOT NULL AND k.kondisi_tabat IS NOT NULL THEN k.tanggal END) AS kunjungan_lengkap,
       SUM(CASE WHEN t.jenis = 'periksa' AND t.status = 'terbukti' THEN 1 ELSE 0 END) AS terbukti
FROM ana.blocks b
LEFT JOIN ana.seed_akses a ON a.block_id = b.block_id
LEFT JOIN kunjungan k ON k.block_id = b.block_id
LEFT JOIN tugas t ON t.block_id = b.block_id
WHERE b.kelas IN ('P1', 'P2')
GROUP BY b.block_id;
```

`isReady` dan `readiness` dihitung di `rules.ts` dari hasil query ini (PRD §5.3), bukan di SQL, supaya satu definisi dipakai server dan klien.

## 6. Kontrak API

Semua respons: `{ "data": …, "meta": { "as_of": "2027-06-01", "demo": true } }`, atau `{ "error": "…" }` dengan status 4xx.

### `GET /api/ringkasan?elnino=0|1&kab=`

```json
{ "data": {
  "hari_menuju_tenggat": 61,
  "el_nino": false,
  "kesiapan": { "siap": 0, "wajib": 358, "pct": 0.0 },
  "per_kabupaten": [ { "kab_id": "…", "nama": "…", "siap": 0, "wajib": 0, "pct": 0.0 } ],
  "urus_dulu": [ { "block_id": 0, "kab": "…", "kelas": "P1", "tenggat": "2027-07-11", "urgensi": "terlambat", "alasan": "berulang 3 tahun, terakhir 2023, belum diperiksa" } ],
  "tugas": { "terlambat": 0, "minggu_ini": 0 }
}}
```

Nol di contoh hanya placeholder; nilai datang dari seed.

### `GET /api/blok/[id]`

`{ block, years: [{tahun, pos_cells, obs_full_cells}], kab, akses, tabat: [...], kunjungan: [...], tugas: [...], urgensi, tenggat, jawaban: { riwayat, kondisi, tindakan, tenggat } }`. `jawaban` berisi kalimat template, bukan AI.

### `PATCH /api/tugas/[id]`

```json
{ "aksi": "setujui", "pemilik": "regu", "tenggat": "2027-07-11" }
{ "aksi": "tolak", "alasan": "akses_terputus", "catatan": "jembatan putus sejak Mei" }
{ "aksi": "status", "ke": "terbukti" }
{ "aksi": "buka" }
```

Validasi: `aksi` ∈ {setujui, tolak, status, buka}; `alasan` ∈ enum PRD §5.6; `catatan` ≤ 500 karakter; peran sesuai §4.1. Gagal → 400/403 dengan pesan Bahasa Indonesia.

### `POST /api/kunjungan`

Body = kolom §4.2 tanpa `kunjungan_id` dan `created_at`. Wajib: `client_id`, `block_id`, `jenis`, `tanggal`. Respons `201 { kunjungan_id }`, atau `200 { kunjungan_id, duplikat: true }` bila `client_id` sudah ada. Efek samping: transisi status tugas otomatis (§4.1).

### `POST /api/alasan/sortir`

`{ "teks": "jalan ke blok tergenang" }` → `{ "alasan": "akses_terputus", "sumber": "ai" | "kata_kunci" }`.

### `POST /api/demo/reset`

Menghapus ops DB lalu menyalin ulang `seed_*`. Respons `{ ok: true }`. Hanya koordinator.
