# PROGRESS TABAT

Keputusan user 13 Nov 2026: izin unduh GADM L2 = ya (sudah diunduh ke `pipeline/data_ext/gadm41_IDN_2.json`); deploy Vercel (T76) ditunda sampai user cek lokal; target = secepatnya, semua P0–P2.

| ID | Judul | Model | Status | Tanggal | Catatan |
|---|---|---|---|---|---|
| T00 | Kickoff orkestrasi | O | selesai | 2026-11-13 | agen + PROGRESS dibuat |
| T01 | Scaffold folder | H | selesai | 2026-11-13 | struktur 02 §3 |
| T02 | Scaffold Next.js + token | S | selesai | 2026-11-13 | |
| T10 | Config + tabel blocks | S | selesai | 2026-11-13 | |
| T11 | block_years dari raster | S | selesai | 2026-11-13 | |
| T12 | Kabupaten (GADM L2) | S | selesai | 2026-11-13 | |
| T13 | GeoJSON statis | S | selesai | 2026-11-13 | |
| T14 | Replay & kurva | S | selesai | 2026-11-13 | |
| T15 | Facts & konteks | H | selesai | 2026-11-13 | |
| T16 | Seed demo | S | selesai | 2026-11-13 | |
| T17 | check_numbers.py | S | selesai | 2026-11-13 | |
| T18 | Gate G1 | O | selesai | 2026-11-13 | G1 lulus: check_numbers 134 cek; P1 siap 34,4%; nama kab Banjarbaru/Kotabaru dikoreksi |
| T20 | Lapisan DB | S | selesai | 2026-11-13 | |
| T21 | Aturan bisnis | S | selesai | 2026-11-13 | |
| T22 | Auth demo | S | selesai | 2026-11-13 | |
| T23 | Shell & UI dasar | S | selesai | 2026-11-13 | |
| T24 | Copy & konstanta | H | selesai | 2026-11-13 | |
| T30 | API baca | S | selesai | 2026-11-13 | |
| T31 | API tugas | S | selesai | 2026-11-13 | |
| T32 | API kunjungan & reset | S | selesai | 2026-11-13 | |
| T33 | Skrip smoke API | H | selesai | 2026-11-13 | |
| T34 | Gate G2 | O | selesai | 2026-11-13 | G2 lulus: tsc, lint, rules 9/9, smoke API semua sesuai |
| T40 | Komponen peta | S | selesai | 2026-11-13 | waktu muat penuh diukur ulang di G3 |
| T41 | Hero Kesiapan | S | selesai | 2026-11-13 | |
| T42 | Peta Riwayat | S | selesai | 2026-11-13 | |
| T43 | Kartu Lokasi | S | selesai | 2026-11-13 | /blok/abc tampil not-found tetapi HTTP 200 (streaming) |
| T44 | Papan Tugas | S | selesai | 2026-11-13 | |
| T45 | Gate G3 | O | selesai | 2026-11-13 | G3 lulus: hero = SQL manual (123/358); peta mini diberi zoom ke blok; daftar kabupaten tertinggal hanya fokus ≥5 blok |
| T50 | Simulasi | S | selesai | 2026-11-13 | |
| T51 | Tolak dengan alasan | S | selesai | 2026-11-13 | |
| T52 | Putar Ulang 2023 | S | selesai | 2026-11-13 | |
| T53 | Cek Data | S | selesai | 2026-11-13 | angka jendela 92,5%/75,1% tidak ada di registri riset → ditampilkan tanpa angka |
| T54 | TABAT Lapangan | S | selesai | 2026-11-13 | |
| T55 | Gate G4 | O | selesai | 2026-11-13 | G4: 10 layar × 4 persona 200 tanpa galat; grep kata terlarang bersih (1 perbaikan di /data); Playwright di T71 |
| T60 | Lapisan AI | S | selesai | 2026-11-13 | jalur AI hidup hanya diuji dengan client tiruan; tanpa kunci → templat/kata kunci |
| T61 | Ekspor CSV | H | selesai | 2026-11-13 | tenggat blok tanpa tugas = deadlineFor(akses demo), data_demo=1 |
| T62 | Logo & manifest | S | selesai | 2026-11-13 | RegisterSW dipasang di /lapangan |
| T63 | Tur pengenalan | S | selesai | 2026-11-13 | |
| T64 | Gate G5 | O | selesai | 2026-11-13 | G5 lulus (AI mati): ai 6/6, reasons+rules 10/10, sortir dan ringkasan-ai jalan |
| T70 | Grep kejujuran & copy | H | selesai | 2026-11-13 | kata terlarang 0; DemoBadge ditambah di daftar kabupaten, fallback peta, papan tugas, dialog bukti, baris tindakan/tenggat Kartu Lokasi; fmtPct di /data |
| T71 | Playwright smoke | S | selesai | 2026-11-13 | lulus 3× berturut-turut (Edge, 6 tes serial) |
| T72 | Aksesibilitas & 375 px | S | selesai | 2026-11-13 | Lighthouse a11y 100 (/, /tugas, /blok, /lapangan); --ink-3 → #5f6b77 (4,95:1); tombol aksen #b94a33 |
| T73 | Kinerja | S | selesai | 2026-11-13 | LCP hero 0,47 s; blocks.geojson 1,04 MB (gzip 106 KB); peta idle 1,6–1,8 s; cache /geo/* 1 hari |
| T74 | Audit angka | O | selesai | 2026-11-13 | selisih 0 (docs/AUDIT_ANGKA.md); ditambah kartu Konsentrasi/Moran di /bukti |
| T75 | Tangkapan layar poster | H | selesai | 2026-11-13 | 6 PNG 2× di docs/screens; label peta kabupaten dideklutter, tombol Tur disembunyikan saat ?tur=0 |
| T76 | Deploy | O + user | ditunda | | menunggu keputusan user: akun Vercel, env, Deployment Protection |
| T77 | Dokumentasi akhir | H | selesai | 2026-11-13 | README, PROGRESS, 03 §6.1 angka final |

## Ringkasan gate

| Gate | Status |
|---|---|
| G0 | lulus |
| G1 | lulus (check_numbers 134/134) |
| G2 | lulus |
| G3 | lulus |
| G4 | lulus |
| G5 | lulus untuk AI mati; jalur AI hidup hanya diuji dengan client tiruan |
| G6 | sebagian: tangkapan layar & PROGRESS selesai; URL Vercel publik belum (T76 ditunda) |

## Redesign visual & 3D (07_REDESIGN_3D, disetujui 13 Nov 2026)

| ID | Judul | Model | Status | Tanggal | Catatan |
|---|---|---|---|---|---|
| R0 | Spike ekstrusi | O | selesai | 2026-11-14 | opacity ekstrusi tidak dukung feature-state → properti t/y + filter |
| R1 | Token & tipografi | S | selesai | 2026-11-14 | 25 pasangan kontras ≥ 4,5:1 (`scripts/contrast.mjs`); Lighthouse a11y 100 |
| R2 | Siluet Indonesia | S | selesai | 2026-11-14 | indonesia.geojson 103 KB, inset SVG 32 KB, tombol "Lihat Indonesia"; check_numbers 180/180 |
| R3 | Menara pengulangan /peta | S | selesai | 2026-11-14 | `?tampil=3d`, pilar 62%, 3.000 m/tahun, idle ±1 s |
| R4 | Tumpukan tahun /bukti | S + O | selesai | 2026-11-14 | 3D bawaan, sakelar 2D; angka 9,3/46,2/8,9 tetap |
| R5 | Penampang gambut | S | selesai | 2026-11-14 | tes peat lulus; kedalaman berlabel ilustrasi + DEMO |
| R6 | Hero 3D opsional | S | selesai | 2026-11-14 | mati bawaan, `?peta3d=1`; LCP hero 540 ms |
| R7 | QA | O | selesai | 2026-11-14 | tsc, lint, tes unit 19/19, Playwright 6/6, audit angka 0 selisih, 9 tangkapan layar baru |
