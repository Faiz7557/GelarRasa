# 04 · Design Brief TABAT

Turunan dari [00_BRIEF](00_BRIEF.md) dan [03_APP_FLOW](03_APP_FLOW.md). Harus serasi dengan infografis (Bab III memakai `Paket_Riset…/outputs/infografis_figma/`), karena tangkapan layar app masuk ke poster Bab IV.

## 1. Arah visual

**"Buku lapangan yang rapi."** Kertas hangat, tinta gelap, satu aksen bata-api, warna data yang sama dengan poster. Tenang dan bisa dipercaya, bukan dashboard neon. Pola tata letak meniru Sparekit (kartu besar lembut, angka besar, jawaban dulu lalu alasan) tetapi dengan identitas sendiri: peta 2D lahan gambut menggantikan pabrik 3D.

Tiga kata kunci: **jelas** (satu pertanyaan per layar), **membumi** (istilah lapangan: tabat, regu, muka air), **jujur** (label demo dan batasan selalu terlihat).

## 2. Token

> **Diperbarui 14 Nov 2026:** nilai token warna dan tipografi di bagian ini digantikan oleh [07_REDESIGN_3D](07_REDESIGN_3D.md) §4 (palet Grow, Hint of Caramel, Potter's Clay, Weathervane). Struktur token dan aturan pemakaiannya tetap.

Didefinisikan di `app/app/globals.css` sebagai CSS custom properties, lalu dipetakan ke Tailwind v4 `@theme`.

### 2.1 Netral

| Token | Nilai | Pakai |
|---|---|---|
| `--ground` | `#f6f4ef` | latar halaman |
| `--panel` | `#ffffff` | kartu |
| `--panel-2` | `#faf8f4` | kartu sekunder, sidebar |
| `--line` | `rgb(31 41 51 / 0.08)` | garis rambut |
| `--line-2` | `rgb(31 41 51 / 0.16)` | garis tegas |
| `--ink` | `#1f2933` | teks utama (sama dengan poster) |
| `--ink-2` | `#47515c` | teks kedua |
| `--ink-3` | `#7b8794` | keterangan (sama dengan poster `muted`) |

### 2.2 Data (sama persis dengan poster)

| Token | Nilai | Makna |
|---|---|---|
| `--tipe-1` | `#9fbfd4` | Jejak sekali di tahun kering |
| `--tipe-2` | `#e9c46a` | Jejak di luar tahun El Niño |
| `--tipe-3` | `#c8553d` | Kantong berulang |
| `--hotspot` | `#6b1d1d` | garis tepi hotspot Gi* |
| `--gambut` | `#dfe4e8` | latar gambut |
| `--luar` | `#e4e7eb` | di luar jendela studi |
| `--laut` | `#eef4f8` | laut |
| `--el-nino` | `#c8553d` | tahun El Niño di strip/batang |

### 2.3 Status (beda dari data, selalu berlabel teks)

| Token | Nilai | Teks di atasnya | Makna |
|---|---|---|---|
| `--telat` / `--telat-soft` | `#b42318` / `#fdecea` | `#8a1c12` | lewat tenggat, belum siap |
| `--segera` / `--segera-soft` | `#b7791f` / `#fdf3dc` | `#7a4f0f` | tenggat ≤ 7 hari |
| `--siap` / `--siap-soft` | `#2f7d4f` / `#e6f4ec` | `#1f5a37` | siap / terbukti |
| `--air-aman` | `#2b6cb0` | — | muka air ≤ 40 cm |
| `--air-kering` | `#b42318` | — | muka air > 40 cm |
| `--demo` / `--demo-soft` | `#6b5b95` / `#efecf6` | `#4c3f73` | lencana dan pita "demo fiktif" |

Aturan: warna status **tidak pernah** dipakai sebagai satu-satunya pembeda; selalu ada ikon atau teks ("Terlambat", "Siap").

### 2.4 Tipografi

| Peran | Font | Ukuran / tinggi baris | Berat |
|---|---|---|---|
| Angka hero | Poppins | 64/68 | 700 |
| Judul halaman | Poppins | 28/34 | 700 |
| Judul kartu | Poppins | 18/24 | 600 |
| Isi | Inter | 15/24 | 400 |
| Label kecil | Inter | 13/18 | 500 |
| Angka tabel | Inter `tabular-nums` | 14/20 | 500 |

Muat lewat `next/font/google` (Poppins 600/700, Inter 400/500). Poppins dipakai juga di poster, jadi tangkapan layar serasi.

### 2.5 Bentuk dan jarak

- Radius: kartu 16 px, kontrol 10 px, lencana 999 px.
- Bayangan: tidak ada, kecuali popover (`0 8px 24px rgb(0 0 0 / .08)`).
- Grid desktop: sidebar 248 px + konten maksimal 1280 px, gutter 24 px. Ponsel: gutter 16 px.
- Skala jarak 4 px (4, 8, 12, 16, 24, 32, 48).

## 3. Komponen

Nama berkas di `app/components/`. Kolom "acuan" menunjuk komponen Sparekit yang polanya boleh ditiru (bukan disalin mentah).

| Komponen | Isi | Acuan Sparekit |
|---|---|---|
| `Shell` | sidebar pertanyaan, header persona, pita demo | `shell.tsx` |
| `CountdownBadge` | "61 hari menuju 1 Agu" | sidebar TA countdown |
| `ReadinessRing` | cincin persen + rincian 4 syarat | `range-gauge.tsx` |
| `KabupatenMap` | choropleth kabupaten % siap | `plant-view.tsx` (label "X dari Y") |
| `BlockMap` | MapLibre: blok, hotspot, jendela, kabupaten | — |
| `UrusDulu` | daftar 5 baris berurgensi | "Deal with these first" |
| `AnswerCard` | jawaban 4 baris (riwayat, kondisi, tindakan, tenggat) | `part-answer.tsx` |
| `YearStrip` | 10 kotak tahun, El Niño bertanda | — |
| `DotIndicator` | bulatan persentil 4 titik | kartu tipe Bab III |
| `TaskBoard` / `TaskCard` | papan 5 kolom | `todo-board.tsx` |
| `RejectDialog` | 5 alasan + teks bebas + Sortir | `reject-dialog.tsx` |
| `StepperTABAT` | T-A-B-A-T | `decide-steps.tsx` |
| `CoverageChart` | kurva N → % tertangkap, garis acak | — |
| `ReplayPlayer` | animasi 3 langkah | `replay-view.tsx` |
| `DemoBadge` / `DemoRibbon` | lencana ungu "demo" | — |
| `FieldForm` | formulir ponsel tombol besar | — |
| `SyncPill` | Daring / Luring · n antre | — |
| `EmptyState`, `ErrorCard`, `Skeleton` | status | — |

## 4. Peta

MapLibre GL dengan gaya lokal (tanpa tile), lapisan dari bawah ke atas:

| Urutan | Lapisan | Sumber | Gaya |
|---|---|---|---|
| 1 | laut | `background` | `--laut` |
| 2 | provinsi tetangga | `provinsi.geojson` | isi `#f4f5f7`, garis `#c9ced4` 1 px |
| 3 | Kalteng–Kalsel | idem | isi putih, garis `#9aa5b1` 1,5 px |
| 4 | di luar jendela | `jendela.geojson` (selisih) | `--luar` |
| 5 | gambut | `gambut.geojson` | `--gambut` |
| 6 | kabupaten | `kabupaten.geojson` | garis `#c9ced4` 0,8 px; di hero: isi menurut % siap (5 kelas, dari `--telat-soft` ke `--siap-soft`) |
| 7 | blok | `blocks.geojson` + `feature-state` dari `/api/blok-atribut` | isi menurut tipe; `LAIN` transparan; opasitas 0,9 |
| 8 | hotspot | `blocks.geojson` filter hotspot | garis `--hotspot` 1,2 px |
| 9 | jendela studi | `jendela.geojson` | garis `--ink` 1,2 px putus-putus `[3,2]` |
| 10 | sorotan | blok terpilih | garis `--ink` 2,5 px |
| 11 | label | kabupaten & provinsi | Inter 12 px `--ink-3`, halo putih |

Zoom awal: batas Kalteng–Kalsel. Kontrol: zoom +/−, "Kembali ke jendela studi". Legenda selalu tampil dengan kalimat "riwayat pengulangan, bukan peluang terbakar". Bila WebGL tidak tersedia, tampilkan daftar blok (prinsip yang sama dengan Sparekit saat 3D mati).

## 5. Grafik

Recharts, tanpa grid vertikal, sumbu tipis `--line-2`, label `--ink-3` 12 px, angka `id-ID`. Kurva cakupan: garis `--tipe-3` 2,5 px untuk TABAT, garis putus `--ink-3` untuk acak, titik penanda N aktif. Strip tahun dan batang tahunan memakai warna yang sama dengan poster P1_A.

## 6. Tulisan (copy)

- Bahasa Indonesia baku tapi akrab, kalimat pendek, kata kerja di depan untuk tombol: "Setujui", "Tolak", "Buat tugas", "Kirim ke WhatsApp", "Tandai terbukti".
- Istilah tetap: **blok**, **tabat**, **muka air**, **regu**, **tenggat**, **kesiapan**, **jejak**, **berulang**, **kantong berulang**, **hotspot pengulangan**.
- **Dilarang:** prediksi, ramalan, peluang terbakar, risiko terbakar tahun ini, AI memutuskan, dijamin, pasti.
- Angka: `1.841 blok`, `46,2%`, `62 cm`, `1 Agu 2027`. Satuan selalu tertulis.
- Data demo: lencana **"demo"** di setiap angka atau baris yang berasal dari seed/ops; pita tetap di shell.
- Kalimat AI selalu diberi keterangan sumber: "ditulis AI dari angka TABAT" atau "templat".

## 7. Ikon dan ilustrasi

- Ikon lucide-react outline 1,75 px: `CalendarClock`, `Map`, `ListTodo`, `History`, `ShieldCheck`, `Smartphone`, `Droplets` (muka air), `Construction` (tabat), `Route` (akses), `Camera`, `CloudOff` (luring), `Flame` (jejak).
- Logo: wordmark "TABAT" Poppins 700 + glif sekat sederhana (dua tiang + papan melintang di atas garis air). Dibuat sebagai SVG di `app/app/icon.svg`.
- Tidak ada foto stok. Bila butuh ilustrasi, gunakan garis sederhana satu warna.

## 8. Gerak

`motion`: transisi kartu 160–220 ms ease-out; hitung mundur dan persen beranimasi sekali saat muat (≤ 600 ms); animasi Putar Ulang 3 langkah @ 1,2 s per langkah dengan tombol jeda. Hormati `prefers-reduced-motion` (tanpa animasi angka, langkah replay manual).

## 9. Aksesibilitas

Kontras ≥ 4,5:1 untuk teks; warna data di peta disertai legenda dan pola garis untuk hotspot; semua kontrol bisa dicapai keyboard dengan cincin fokus `--ink` 2 px; dialog menahan fokus; tombol ikon punya `aria-label`; peta punya daftar setara di panel kanan.

## 10. Tangkapan layar untuk poster

Simpan di `tabat-app/docs/screens/`, PNG 2× dan SVG bila memungkinkan:

| Berkas | Layar | Ukuran viewport |
|---|---|---|
| `01_kesiapan.png` | `/` koordinator | 1440 × 900 |
| `02_kartu_lokasi.png` | `/blok/[id]` P1 terlambat | 1440 × 900 |
| `03_tugas.png` | `/tugas` | 1440 × 900 |
| `04_lapangan.png` | `/lapangan` | 390 × 844 |
| `05_bukti.png` | `/bukti` langkah 3 | 1440 × 900 |
| `06_simulasi.png` | `/peta` dengan laci simulasi | 1440 × 900 |

Dibuat dengan Playwright (`channel: 'msedge'`) setelah **Reset demo**, agar angka di poster stabil.
