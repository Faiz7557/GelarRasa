# 02 · TRD TABAT (Technical Requirements Document)

Turunan dari [00_BRIEF](00_BRIEF.md) dan [01_PRD](01_PRD.md). Skema detail di [05_BACKEND_SCHEMA](05_BACKEND_SCHEMA.md).

## 1. Arsitektur

```
Paket_Riset_Karhutla_Berulang/            (riset, sumber kebenaran angka)
  outputs/bab3/*.csv, data/rasters/*.tif, data/boundaries/*
            │
            ▼  pipeline/ (Python 3.13, dijalankan lokal, bukan di Vercel)
  build_db.py ──► app/data/tabat.db        (analitik, READ-ONLY saat runtime)
              ──► app/public/geo/*.geojson (geometri statis untuk peta)
  seed_demo.py ─► tabel seed_* di tabat.db (data lapangan DEMO fiktif, deterministik)
  check_numbers.py (gate angka; wajib lulus sebelum commit DB)
            │
            ▼  app/ (Next.js 16, App Router, Node runtime, Vercel)
  Server Components ──► lib/db.ts (better-sqlite3, readonly) ──► tabat.db
  Route Handlers /api/* ──► lib/ops.ts (better-sqlite3, read-write) ──► /tmp/tabat-ops.sqlite
                                     (disalin dari seed_* saat cold start; "Reset demo")
  Client Components: MapLibre GL (GeoJSON statis + atribut dari API), Recharts
  lib/ai.ts ──► Anthropic API (opsional; fallback template bila tanpa kunci)
```

Prinsip yang diambil dari Sparekit (`caliber-final/app/lib/db.ts`, `decisions-db.ts`, `ai.ts`):

1. **Dua SQLite.** Analitik dibundel read-only; operasional (tugas, kunjungan, keputusan) ditulis ke `/tmp`. Di Vercel data operasional hilang saat instance berganti, dan UI menulis "sesi demo".
2. **Mesin di pipeline, app hanya membaca.** Semua angka riset dihitung Python dan disimpan; app tidak menghitung ulang statistik spasial.
3. **AI menulis, bukan menghitung.** Server membangun fakta dari DB; model hanya merangkai kalimat atau memilih kategori; selalu ada fallback.

## 2. Stack

| Lapisan | Pilihan | Versi | Alasan |
|---|---|---|---|
| Framework | Next.js App Router | 16.4.5 | sama dengan Sparekit; tim sudah terbiasa |
| UI | React | 19.3.0 | idem |
| Gaya | Tailwind CSS v4 (`@tailwindcss/turbopack`) | ^4 | token CSS di `globals.css` |
| DB | better-sqlite3 | ^13.0.3 | sinkron, cepat, dibundel |
| Peta | maplibre-gl | ^5 | WebGL, GeoJSON lokal, tanpa tile eksternal |
| Grafik | recharts | ^3.10.1 | sama dengan Sparekit |
| Ikon | lucide-react | ^1.67.0 | gaya outline konsisten |
| Animasi | motion | ^14.9.0 | transisi hero dan replay |
| Util | clsx, tailwind-merge, server-only | — | — |
| AI | `@anthropic-ai/sdk` | terbaru stabil | `claude-haiku-5-5` (sortir alasan), `claude-sonnet-5-5` (ringkasan) |
| Pipeline | Python 3.13: pandas, numpy, geopandas, shapely 2, rasterio | sudah terpasang | sama dengan paket riset |
| Deploy | Vercel, Node runtime | — | `outputFileTracingIncludes` untuk `data/tabat.db` |

**Tidak dipakai:** three.js (peta 2D cukup), tile server, ORM, state manager global, nodemailer (diganti tautan WhatsApp).

## 3. Struktur repo

```
tabat-app/
├── docs/                      # 00–06 + screens/
├── pipeline/
│   ├── build_db.py            # tabat.db + geojson
│   ├── seed_demo.py           # data demo fiktif
│   ├── check_numbers.py       # gate angka
│   ├── config.py              # path ke paket riset, konstanta
│   └── README.md
└── app/
    ├── app/
    │   ├── (main)/layout.tsx  # shell: sidebar pertanyaan, header persona, pita demo
    │   ├── (main)/page.tsx            # F-01 Kesiapan
    │   ├── (main)/peta/page.tsx       # F-02 + F-08
    │   ├── (main)/blok/[id]/page.tsx  # F-03
    │   ├── (main)/tugas/page.tsx      # F-04
    │   ├── (main)/bukti/page.tsx      # F-07
    │   ├── (main)/data/page.tsx       # F-11
    │   ├── lapangan/page.tsx          # F-12 (layout ponsel tersendiri)
    │   ├── masuk/page.tsx             # F-05
    │   └── api/…                      # lihat §6
    ├── components/            # map/, cards/, board/, field/, ui/
    ├── lib/                   # db.ts, ops.ts, data.ts, rules.ts, ai.ts, auth.ts, people.ts, format.ts, wa.ts
    ├── data/tabat.db
    └── public/geo/            # blocks.geojson, kabupaten.geojson, provinsi.geojson, jendela.geojson, gambut.geojson
```

## 4. Pipeline data

Semua skrip dijalankan dari `tabat-app/`: `/c/Python313/python.exe pipeline/<skrip>.py`. Path riset di `pipeline/config.py`:

```python
RISET = Path(__file__).resolve().parents[2] / 'Paket_Riset_Karhutla_Berulang'
AS_OF = '2027-06-01'; DEADLINE = '2027-08-01'; SEED = 2026
```

### 4.1 `build_db.py` (urutan langkah)

| Langkah | Input | Output | Catatan |
|---|---|---|---|
| 1. Blok | `outputs/bab3/panel2_blok_lengkap.csv`, transform raster 2015 | tabel `blocks` | geometri blok dari `row/col` × 5 sel (sama dengan `build_figma_svg.py`), lalu `to_crs(4326)`; simpan centroid lon/lat |
| 2. Riwayat per tahun | raster 2015–2024 + mask gambut (fungsi `annual()` di `build_figma_svg.py`) | tabel `block_years` | per blok per tahun: `pos_cells`, `obs_full` (sel teramati lengkap). Aturan QA sama dengan notebook 03–05 |
| 3. Kelas & urutan | `blocks` | kolom `kelas`, `rank_in_kelas`, `rank_global` | aturan PRD §5.1–5.2 |
| 4. Kabupaten | GADM 4.1 level 2 (`gadm41_IDN_2.json`) | tabel `kabupaten`, kolom `blocks.kab_id` | blok → kabupaten berdasarkan centroid; blok di luar Kalteng/Kalsel tetap disimpan dengan `kab_id` provinsi tetangga. **Unduhan GADM level 2 butuh persetujuan user** |
| 5. Geometri | blok, kabupaten, provinsi, jendela studi, gambut | `public/geo/*.geojson` | `simplify(0.002)` untuk kabupaten; blok tetap persegi (5 titik); properti hanya `id` agar file kecil |
| 6. Replay | logika `Paket_Riset…/scripts/replay_2023.py` | tabel `replay`, `replay_curve` | kurva: N = 25, 50, …, 1.000 blok teratas (skor 2015–2022) → % jejak 2023 tertangkap; baris pembanding acak |
| 7. Kurva cakupan | `blocks.repeated_cells` | tabel `coverage_curve` | N blok teratas (urutan PRD §5.2) → % luas berulang 2015–2024 |
| 8. Konteks | `registri_angka_bab3.csv`, `panel1_konsentrasi_el_nino.csv`, GWIS bulanan, `panel3_sorotan_eksternal.csv` | `facts`, `season_monthly`, `external_facts` | semua angka bernama, dipakai UI lewat kunci |
| 9. Meta | konstanta | `meta` | `as_of`, `deadline`, `data_window`, `version`, `built_at` |

### 4.2 `seed_demo.py`

Deterministik (`numpy.random.default_rng(SEED)`). Mengisi tabel `seed_*` (lihat 05 §3.3): akses per blok prioritas, tabat demo (0–3 per blok P1/P2), kunjungan masa lalu, tugas berbagai status, alasan tolak contoh. Target sebaran demo per `as_of`:

- Kesiapan P1 sekitar 30–40% (supaya hero bercerita "belum aman").
- Minimal 1 kabupaten tertinggal jelas (kesiapan < 15%).
- 8–12 tugas terlambat.
- 5 contoh alasan tolak, tersebar di 4 kategori.

Setiap baris seed punya kolom `is_demo = 1`.

### 4.3 `check_numbers.py` (gate)

Gagal (exit 1) bila salah satu tidak terpenuhi:

```
count(blocks) == 5633
count(blocks where tipe>0) == 1841
kelas counts: P1 358, P2 166, CEK 119, PANTAU 1198, LAIN 3792
count(blocks where hotspot) == 462 ; round(100*462/5633,1) == 8.2
round(% repeated_cells in hotspot,1) == 77.8
replay: 'blok berulang 2015-22' pct_blok 9.3, pct_tangkap 46.2 ; acak 8.9
facts['agu_okt_pct'] == 95.5 ; facts['moran_I'] == 0.69 ; facts['rasio_acak'] == 2.81
sum(block_years.pos_cells)*cell_ha per tahun == deret tahunan Bab III (688.045 ha total, toleransi 1 ha)
every seed_* row has is_demo = 1
```

Catatan: deret tahunan Bab III dihitung pada seluruh sel mask; `block_years` hanya sel di dalam blok yang dipakai (≥ 50% sel dalam mask). Bila totalnya berbeda, simpan juga `facts['annual_window_ha_<tahun>']` dari fungsi `annual()` dan uji keduanya terpisah; jangan memaksa sama.

## 5. Aturan dan algoritma (implementasi)

Semua di `app/lib/rules.ts`, fungsi murni, dipakai server dan klien. Satu file uji `rules.test.ts` (node:test, tanpa framework tambahan).

| Fungsi | Definisi |
|---|---|
| `kelasOf(tipe, hotspot)` | PRD §5.1 |
| `compareBlocks(a, b)` | PRD §5.2 |
| `deadlineFor(akses)` | `DEADLINE − {jalan:7, sungai:14, sulit:21}[akses] − 7` hari |
| `isReady(block, visits, tasks, asOf)` | PRD §5.3 |
| `readiness(blocks, …, {elNino})` | `{siap, wajib, pct}`; wajib = P1 (+P2 bila `elNino`) |
| `waterStatus(cm)` | `null → 'belum'`, `≤40 → 'aman'`, `>40 → 'kering'` |
| `capacityPlan(blocks, n, {elNino})` | ambil n blok teratas dari kelas wajib (lalu kelas berikutnya); kembalikan daftar + % luas berulang tertangkap (lookup `coverage_curve`) |
| `urgency(block, today)` | `terlambat` (lewat tenggat, belum siap) · `minggu_ini` (tenggat ≤ 7 hari) · `bulan_ini` · `aman` |

## 6. API (Route Handlers)

Semua `GET` membaca DB analitik (+ ops untuk status). Semua `POST/PATCH` memvalidasi peran dari sesi dan isi body (validasi manual, tipe sempit). Detail payload di 05 §4.

| Metode & path | Fungsi | Peran |
|---|---|---|
| `GET /api/ringkasan?elnino=0\|1&kab=` | angka hero, per kabupaten, "Urus ini dulu" | semua |
| `GET /api/blok?kelas=&kab=&limit=` | daftar blok terurut + status | semua |
| `GET /api/blok/[id]` | Kartu Lokasi lengkap | semua |
| `GET /api/blok-atribut` | atribut ringkas semua blok untuk pewarnaan peta (id, kelas, tipe, hotspot, status) | semua |
| `GET /api/tugas?status=&pemilik=` | papan tugas | semua |
| `POST /api/tugas` | buat usulan tugas dari blok | koordinator, kampus |
| `PATCH /api/tugas/[id]` | setujui / tolak (dengan alasan) / ubah status / tetapkan pemilik | sesuai matriks 03 §4 |
| `POST /api/kunjungan` | simpan kunjungan dari Lapangan (idempoten via `client_id`) | regu, pengelola |
| `POST /api/alasan/sortir` | teks bebas → kategori alasan (AI, fallback kata kunci) | koordinator |
| `GET /api/ringkasan-ai` | paragraf status (P2) | koordinator |
| `POST /api/demo/reset` | salin ulang seed ke ops DB | koordinator |
| `GET /api/ekspor.csv` | ekspor (P2) | koordinator |
| `POST /api/auth/masuk`, `POST /api/auth/keluar`, `POST /api/auth/ganti` | sesi persona | publik / masuk |

## 7. Autentikasi demo

- Persona tetap di `lib/people.ts` (4 persona PRD §2). Login `nama@tabat.demo`, kata sandi demo dari env `DEMO_PASSWORD` (default `tabat2026` di `.env.example`, bukan di kode klien).
- Cookie `tabat_session` = `personaId.hmac` (HMAC-SHA256, `SESSION_SECRET`), `httpOnly`, `sameSite=lax`, `secure` di produksi.
- `proxy.ts` (middleware Next 16) mengarahkan ke `/masuk` bila tidak ada sesi, kecuali `/masuk`, `/api/auth/*`, aset statis.

## 8. AI (opsional, P1/P2)

- `lib/ai.ts` server-only. Kunci di `ANTHROPIC_API_KEY`. Tanpa kunci → fungsi mengembalikan hasil template dengan `source: 'template'`.
- `sortirAlasan(teks)` → model `claude-haiku-5-5`, keluaran JSON terbatas pada enum alasan PRD §5.6. Fallback: pencocokan kata kunci (`akses|jalan|banjir` → `akses_terputus`, dst.).
- `ringkasanKesiapan()` → model `claude-sonnet-5-5`; input hanya objek fakta dari `/api/ringkasan`; instruksi sistem melarang angka baru dan kata "prediksi".
- Batas pemakaian: `AI_HOURLY_CAP` (default 200 panggilan/jam), cache per input.
- UI selalu menampilkan sumber: "ditulis AI dari angka TABAT" atau "templat".

## 9. TABAT Lapangan (offline)

- Halaman `/lapangan` client-side; daftar tugas diambil sekali lalu disimpan di `localStorage` (`tabat:lapangan:tugas`).
- Kunjungan baru masuk antrean `tabat:lapangan:antre` dengan `client_id` UUID. Saat `navigator.onLine` dan setiap 15 detik, antrean dikirim ke `POST /api/kunjungan`; server idempoten berdasarkan `client_id`.
- Foto: dikompres di klien ke JPEG lebar 800 px, kualitas 0,6, maksimal ~150 KB, disimpan sebagai data URL di ops DB (demo saja; produksi memakai object storage, tertulis di roadmap).
- Koordinat: `navigator.geolocation` bila diizinkan; bila tidak, pakai centroid blok dan tandai `koordinat_sumber = 'centroid'`.

## 10. Persyaratan non-fungsional

| Area | Syarat |
|---|---|
| Kinerja | LCP hero < 2,5 s di laptop (produksi Vercel); `blocks.geojson` < 1,5 MB (gzip < 400 KB); peta interaktif < 2 s; simulasi < 100 ms |
| Responsif | semua layar layak di 1280 px; `/lapangan` dan Kartu Lokasi layak di 375 px tanpa scroll horizontal |
| Aksesibilitas | kontras teks ≥ 4,5:1; warna status selalu disertai label/ikon; fokus keyboard terlihat; `aria-label` pada kontrol ikon; peta punya daftar alternatif yang setara |
| Bahasa & format | Bahasa Indonesia; angka `id-ID` (titik ribuan, koma desimal); tanggal "1 Agu 2027" |
| Keamanan | tidak ada kunci di klien; validasi semua body; batas ukuran body 300 KB; tidak ada data pribadi nyata |
| Kejujuran | komponen `<DemoBadge>` wajib pada setiap angka dari tabel `seed_*`/ops; kata "prediksi/ramalan/peluang terbakar" dilarang (cek `grep` di QA) |
| Keandalan demo | `POST /api/demo/reset` mengembalikan state awal; semua halaman tetap tampil bila ops DB kosong |

## 11. Variabel lingkungan

| Nama | Wajib | Contoh |
|---|---|---|
| `SESSION_SECRET` | ya | 32+ karakter acak |
| `DEMO_PASSWORD` | ya | `tabat2026` |
| `ANTHROPIC_API_KEY` | tidak | — |
| `AI_HOURLY_CAP` | tidak | `200` |
| `NEXT_PUBLIC_DEMO_LABEL` | tidak | `Data lapangan: demo fiktif` |

## 12. Pengujian

| Lapis | Alat | Isi |
|---|---|---|
| Angka | `pipeline/check_numbers.py` | §4.3 |
| Aturan | `node --test app/lib/rules.test.ts` (via `tsx`) | kelas, urutan, tenggat, siap, kapasitas |
| Tipe & lint | `npx tsc --noEmit`, `npm run lint` | nol error |
| Smoke | Playwright (`channel: 'msedge'`, sudah terpasang di mesin dev) | buka 7 halaman, login demo, setujui 1 tugas, kirim 1 kunjungan offline→online |
| Kejujuran | `grep -RniE "prediksi|ramalan|peluang terbakar" app/` | nol hasil di teks UI |

## 13. Deploy

1. `pipeline/build_db.py && pipeline/seed_demo.py && pipeline/check_numbers.py`.
2. `cd app && npm run build` lokal lulus.
3. Vercel: root `tabat-app/app`, Node 20+, env §11, `next.config.ts` memuat `outputFileTracingIncludes: { '/**': ['./data/tabat.db'] }`.
4. Matikan Deployment Protection agar juri tidak bertemu login Vercel.
5. Uji di jendela incognito, ambil tangkapan layar untuk poster.
