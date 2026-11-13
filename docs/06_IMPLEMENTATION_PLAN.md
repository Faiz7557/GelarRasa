# 06 · Implementation Plan TABAT (agentic-driven)

Turunan dari 00–05. Dokumen ini dibaca **orkestrator** (Opus) di awal setiap sesi kerja, lalu dipakai untuk mendelegasikan task ke eksekutor (Sonnet) dan pekerja ringan (Haiku).

## 1. Skema model

| Peran | Model | ID | Effort | Tugas | Tidak boleh |
|---|---|---|---|---|---|
| **Orkestrator & planner** | Claude Opus 5.5 | `claude-opus-5-5` | high | membaca dokumen, memecah task, menulis prompt task, meninjau diff, menjalankan gate, memutuskan potong fitur, memegang integrasi lintas modul, berbicara dengan user | menulis fitur besar sendiri bila bisa didelegasikan; meloloskan gate tanpa menjalankan perintah verifikasi |
| **Eksekutor** | Claude Sonnet 5.5 | `claude-sonnet-5-5` | medium | menulis kode fitur, pipeline, API, komponen, tes; satu task = satu set berkas | mengubah dokumen 00–05; menyentuh berkas di luar daftar task; mengubah angka riset |
| **Ringan** | Claude Haiku 5.5 | `claude-haiku-5-5` | low | scaffold berkas, memuat CSV ke tabel mekanis, string/copy, grep kejujuran, tangkapan layar, memperbarui PROGRESS, skrip smoke sederhana | logika bisnis, aturan prioritas, desain komponen |

### 1.1 Definisi agen (dibuat di T00)

`tabat-app/.claude/agents/tabat-executor.md`

```markdown
---
name: tabat-executor
description: Eksekutor TABAT. Mengerjakan satu task dari docs/06_IMPLEMENTATION_PLAN.md sampai kriteria terimanya lulus.
model: sonnet
effort: medium
tools: Read, Write, Edit, Bash, Grep, Glob
---
Kamu eksekutor proyek TABAT. Baca dulu bagian dokumen yang disebut di task. Ubah HANYA berkas di daftar "Berkas" task.
Jangan mengubah docs/00–05. Jangan mengarang angka: semua angka berasal dari tabat.db atau registri riset.
Kata "prediksi", "ramalan", "peluang terbakar" dilarang di teks UI.
Jalankan perintah "Verifikasi" task sebelum melapor. Laporkan dengan format LAPORAN di docs/06 §5.
Bila terhalang (data hilang, butuh unduhan, butuh keputusan), berhenti dan laporkan; jangan menebak.
```

`tabat-app/.claude/agents/tabat-light.md`

```markdown
---
name: tabat-light
description: Pekerja ringan TABAT untuk task mekanis berisiko rendah (scaffold, copy, grep, tangkapan layar, dokumentasi progres).
model: haiku
effort: low
tools: Read, Write, Edit, Bash, Grep, Glob
---
Kerjakan task persis seperti tertulis. Ubah HANYA berkas di daftar task. Jalankan verifikasi, lapor dengan format LAPORAN.
Bila task ternyata butuh keputusan desain atau logika, berhenti dan laporkan ke orkestrator.
```

### 1.2 Cara mendelegasikan

Sesi utama dijalankan dengan Opus 5.5, effort high. Orkestrator memanggil Agent tool:

```
Agent({ subagent_type: "tabat-executor", model: "sonnet", effort: "medium",
        description: "T41 Hero Kesiapan", prompt: <TEMPLATE §4 terisi> })
Agent({ subagent_type: "tabat-light", model: "haiku", effort: "low",
        description: "T70 grep kejujuran", prompt: <…> })
```

Aturan orkestrasi:

1. **Satu penulis per set berkas.** Task paralel hanya bila daftar berkasnya tidak beririsan. Bila dua task paralel menyentuh `package.json` atau `globals.css`, jalankan berurutan atau pakai `isolation: "worktree"`.
2. **Jangan percaya laporan, jalankan verifikasi.** Setelah setiap task, orkestrator menjalankan sendiri perintah "Verifikasi" dan membaca diff.
3. **Eskalasi.** Haiku gagal 1× → ulangi dengan Sonnet. Sonnet gagal 2× pada kriteria yang sama → orkestrator membaca akar masalah, menulis ulang task (lebih kecil) atau mengerjakan sendiri bagian integrasinya.
4. **Gate per fase.** Fase berikut tidak dimulai sebelum gate fase sebelumnya lulus (§3). Pengecualian: task yang tertulis boleh paralel di §2.
5. **Aksi luar wajib izin user:** unduhan data baru (GADM level 2), `npm install` paket di luar daftar 02 §2, deploy Vercel, membuat akun/kunci API, push ke remote.
6. **Progres** dicatat di `docs/PROGRESS.md` (tabel task: status, model, tanggal, catatan). Diperbarui oleh Haiku setelah setiap gate, atau oleh orkestrator.
7. **Potong dari bawah.** Bila waktu menipis, urutan potong: F-16, F-15, F-17, F-14, F-13, lalu F-08 tanpa tombol "Usulkan N", lalu F-12 tanpa foto. P0 tidak dipotong.

## 2. Fase dan graf dependensi

```
F0 Setup ─► G0
F1 Pipeline ─► G1 (check_numbers lulus)
F2 Fondasi app ─┐
F3 API data ────┴► G2
F4 Layar P0 ─► G3 (demo 0:00–2:15)
F5 Layar P1 ─► G4 (demo penuh 6 menit)
F6 AI & P2 ─► G5
F7 QA & rilis ─► G6 (URL publik + tangkapan layar)
```

Paralel yang aman: T11 ∥ T12 ∥ T15 (setelah T10) · T20 ∥ T21 ∥ T22 · T30 ∥ T31 ∥ T32 (setelah T20, T21) · T41 ∥ T43 ∥ T44 (setelah T40, T23) · T51 ∥ T52 ∥ T53 ∥ T54 · T70 ∥ T72 ∥ T73.

## 3. Gate

| Gate | Syarat lulus (dijalankan orkestrator) |
|---|---|
| **G0** | `tabat-app/app`: `npm run build` lulus; struktur folder sesuai 02 §3; agen terdefinisi |
| **G1** | `python pipeline/build_db.py && python pipeline/seed_demo.py && python pipeline/check_numbers.py` exit 0; ukuran `blocks.geojson` < 1,5 MB; orkestrator memeriksa sebaran seed (kesiapan P1 30–40%, ≥ 1 kabupaten < 15%, 8–12 tugas terlambat) |
| **G2** | `npx tsc --noEmit`, `npm run lint`, `npx tsx --test lib/rules.test.ts` lulus; `node scripts/api-smoke.mjs` semua 2xx; login demo bekerja |
| **G3** | skrip demo 0:00–2:15 berjalan di `npm run dev` tanpa galat konsol; angka hero sama dengan query SQL manual |
| **G4** | skrip demo penuh 6 menit lulus; Playwright smoke lulus; `grep -RniE "prediksi|ramalan|peluang terbakar" app/app app/components` kosong |
| **G5** | AI mati (tanpa kunci) → semua fitur tetap jalan dengan templat; AI hidup → sortir alasan mengembalikan enum valid |
| **G6** | URL Vercel publik terbuka di incognito; tangkapan layar 04 §10 ada; `docs/PROGRESS.md` final |

## 4. Template prompt task (diisi orkestrator)

```
TASK {ID} · {Judul}
Model: {Sonnet/Haiku} · Effort: {medium/low}
Konteks wajib dibaca: {daftar bagian dokumen, mis. 01_PRD §5.1–5.3, 05 §2.3}
Berkas yang boleh diubah/dibuat: {daftar persis}
Langkah:
  1. …
Kriteria terima:
  - …
Verifikasi (jalankan dan tempel keluarannya):
  {perintah}
Larangan: ubah berkas lain; ubah docs/00–05; karang angka; kata terlarang.
Format laporan: docs/06 §5.
```

## 5. Format LAPORAN (wajib dari eksekutor)

```
LAPORAN {ID}
Status: SELESAI | TERHALANG | SEBAGIAN
Berkas diubah: …
Perintah verifikasi & ringkasan keluaran: …
Kriteria terima: [x] … [ ] … (alasan bila belum)
Keputusan kecil yang saya ambil: …
Pertanyaan/terhalang: …
```

## 6. Task

Kolom: **M/E** = model/effort (O = Opus high, S = Sonnet medium, H = Haiku low) · **Dep** = dependensi.

### F0 · Setup

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T00 | Kickoff orkestrasi | O | — | `.claude/agents/*.md`, `docs/PROGRESS.md` | baca 00–06; buat dua definisi agen §1.1; buat PROGRESS berisi semua task berstatus `belum`; konfirmasi ke user: tanggal target, izin unduh GADM L2, akun Vercel | agen ada; PROGRESS lengkap | `ls .claude/agents docs` |
| T01 | Scaffold folder | H | T00 | `pipeline/`, `app/` (kosong), `.gitignore`, `README.md` | buat struktur 02 §3; `.gitignore` berisi `node_modules`, `.next`, `.env*`, `!.env.example`, `__pycache__`, `pipeline/data_ext/`; README singkat menunjuk docs | struktur sama 02 §3 | `find . -maxdepth 2 -type d` |
| T02 | Scaffold Next.js + token | S | T01 | `app/package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, konfigurasi PostCSS/Tailwind, `app/app/layout.tsx`, `app/app/globals.css`, `.env.example` | dependensi persis 02 §2 (+ `maplibre-gl`, `@anthropic-ai/sdk`; dev: `tsx`, `@playwright/test`); token 04 §2 di `globals.css` + `@theme`; font Poppins+Inter via `next/font`; `outputFileTracingIncludes`; halaman sementara "TABAT" | build lulus; token terpakai di halaman sementara | `cd app && npm install && npm run build` |

### F1 · Pipeline data

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T10 | Config + tabel `blocks` | S | T01 | `pipeline/config.py`, `pipeline/build_db.py` (langkah 1, 3, 9) | baca `panel2_blok_lengkap.csv`; hitung geometri blok seperti `build_figma_svg.py` (xs/ys dari transform raster 2015); centroid lon/lat; `kelas`, `rank_in_kelas`, `rank_global` (PRD §5.1–5.2); `repeated_ha`; tulis `blocks`, `meta`; skrip idempoten (hapus DB lama) | 5.633 baris; kelas 358/166/119/1.198/3.792 | `python pipeline/build_db.py` lalu `select kelas,count(*) from blocks group by 1` |
| T11 | `block_years` dari raster | S | T10 | `pipeline/build_db.py` (fungsi `build_block_years`) | salin aturan QA `annual()` dari `build_figma_svg.py`; agregasi 5×5 per tahun ke `pos_cells` dan `obs_full_cells`; simpan `annual` dari `annual()` utuh | 56.330 baris; total `annual.jendela_ha` = 688.045 ± 1 | query jumlah + bandingkan registri |
| T12 | Kabupaten (GADM L2) | S | T10 + izin user | `pipeline/build_db.py` (langkah 4), `pipeline/data_ext/` | **orkestrator minta izin unduh** `gadm41_IDN_2.json` dari situs GADM ke `pipeline/data_ext/`; sisipkan spasi pada nama; `kab_id` tiap blok via centroid; isi `kabupaten` + hitungan `n_p1` dst. | setiap blok punya `kab_id`; kabupaten fokus ditandai | `select count(*) from blocks where kab_id is null` = 0 |
| T13 | GeoJSON statis | S | T10, T12 | `pipeline/build_db.py` (langkah 5), `app/public/geo/*.geojson` | `blocks.geojson` (properti `id` saja, koordinat 5 desimal), `kabupaten`, `provinsi` (Kalimantan saja), `jendela`, `gambut` (simplify 0,003, klip ke jendela) | `blocks.geojson` < 1,5 MB; semua GeoJSON valid | `ls -la app/public/geo` + parse JSON |
| T14 | Replay & kurva | S | T11 | `pipeline/build_db.py` (langkah 6–7) | adaptasi `Paket_Riset…/scripts/replay_2023.py`; isi `replay`, `replay_block`, `replay_curve` (N=25..1.000), `coverage_curve` (N=25..1.841) | `replay` sama dengan `replay_2023.csv` | query `replay` |
| T15 | Facts & konteks | H | T10 | `pipeline/build_db.py` (langkah 8) | muat `registri_angka_bab3.csv`, `panel1_konsentrasi_el_nino.csv`, `panel3_sorotan_eksternal.csv`, GWIS bulanan → `facts`, `season_monthly`, `external_facts`; kunci sesuai 05 §2.7 | semua kunci 05 §2.7 ada | `select key,value from facts` |
| T16 | Seed demo | S | T11, T12, T14 | `pipeline/seed_demo.py` | `default_rng(2026)`; `seed_akses`, `seed_tabat`, `seed_tugas`, `seed_kunjungan`, `seed_aktivitas` sesuai 05 §3 dan target 02 §4.2; semua `is_demo=1`; kunjungan hanya bertanggal ≤ `as_of` | target sebaran terpenuhi (cetak ringkasan) | `python pipeline/seed_demo.py` |
| T17 | `check_numbers.py` | S | T14, T15, T16 | `pipeline/check_numbers.py` | implementasi semua assert 02 §4.3; pesan galat jelas | exit 0 pada DB benar; exit 1 bila satu angka diubah manual (uji sekali, lalu kembalikan) | `python pipeline/check_numbers.py; echo $?` |
| T18 | **Gate G1** | O | T10–T17 | — | jalankan pipeline penuh; periksa sebaran seed; bandingkan 3 blok acak dengan peta P2_A riset | G1 | 02 §4 |

### F2 · Fondasi app

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T20 | Lapisan DB | S | G1, T02 | `app/lib/db.ts`, `app/lib/ops.ts`, `app/lib/format.ts` | `db()` readonly (pola Sparekit); `ops()` membuat `/tmp/tabat-ops.sqlite` bila belum ada, menyalin `seed_*` ke `tugas`/`kunjungan`/`aktivitas`, `ATTACH` analitik sebagai `ana`; `resetOps()`; `format.ts`: angka `id-ID`, persen, tanggal "1 Agu 2027", hari menuju | query gabungan 05 §5 jalan | skrip `tsx` kecil yang mencetak jumlah tugas |
| T21 | Aturan bisnis | S | T02 | `app/lib/rules.ts`, `app/lib/rules.test.ts` | fungsi 02 §5; tes: kelas, urutan, tenggat 3 akses, siap/tidak siap (4 kasus), readiness dengan/tanpa El Niño, capacityPlan, urgency batas 7 hari | ≥ 15 asersi lulus | `npx tsx --test lib/rules.test.ts` |
| T22 | Auth demo | S | T02 | `app/lib/auth.ts`, `app/lib/people.ts`, `app/proxy.ts`, `app/app/masuk/page.tsx`, `app/app/api/auth/*/route.ts` | 02 §7; tombol "Masuk sebagai demo" (koordinator); form email+sandi dalam `<details>`; ganti persona | belum masuk → `/masuk`; masuk → `/`; ganti persona mengubah cookie | uji manual + `curl -i` |
| T23 | Shell & UI dasar | S | T02, T22 | `app/app/(main)/layout.tsx`, `app/components/shell/*`, `app/components/ui/*` (Card, Badge, Button, Dialog, Skeleton, EmptyState, ErrorCard, DemoBadge, DemoRibbon, CountdownBadge, StepperTABAT) | 03 §2 dan 04 §3; responsif: sidebar ↔ bar bawah ≤ 768 px | layar kosong per rute tampil dalam shell; fokus keyboard terlihat | `npm run build` + tinjau 1280 & 375 px |
| T24 | Copy & konstanta | H | T02 | `app/lib/copy.ts` | semua label menu, judul layar, pesan kosong/galat 03 §7, enum alasan beserta label, `KATA_TERLARANG` | string shell diambil dari copy | `npx tsc --noEmit` |

### F3 · API data

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T30 | API baca | S | T20, T21 | `app/app/api/ringkasan/route.ts`, `api/blok/route.ts`, `api/blok/[id]/route.ts`, `api/blok-atribut/route.ts`, `app/lib/data.ts` | 05 §6; `data.ts` berisi fungsi server yang juga dipakai Server Components; `blok-atribut` ringkas (< 200 KB) | bentuk respons sesuai 05 §6; `meta.demo` benar | `curl` 4 endpoint |
| T31 | API tugas | S | T20, T21, T22 | `app/app/api/tugas/route.ts`, `api/tugas/[id]/route.ts` | GET/POST/PATCH; transisi & peran 05 §4.1; tulis `aktivitas`; validasi body; 403 bila peran salah | semua transisi sah lulus; tidak sah 400/403 | `node scripts/api-smoke.mjs tugas` |
| T32 | API kunjungan & reset | S | T20, T22 | `app/app/api/kunjungan/route.ts`, `api/demo/reset/route.ts` | idempoten `client_id`; transisi otomatis; batas body 300 KB; reset hanya koordinator | kirim ganda → 1 baris | smoke |
| T33 | Skrip smoke API | H | T30–T32 | `app/scripts/api-smoke.mjs` | login demo → panggil semua endpoint → cetak status; argumen opsional nama grup | semua 2xx | `node scripts/api-smoke.mjs` |
| T34 | **Gate G2** | O | T20–T33 | — | G2 | G2 | §3 |

### F4 · Layar P0

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T40 | Komponen peta | S | G2 | `app/components/map/BlockMap.tsx`, `map/style.ts`, `map/KabupatenMap.tsx` | MapLibre client-only (`dynamic(..., { ssr: false })`); lapisan 04 §4; `feature-state` dari `/api/blok-atribut`; props: filter, sorot, onBlockClick, mode `kabupaten`/`blok`; fallback daftar bila WebGL mati | 5.633 blok < 2 s; klik blok memanggil callback; legenda + kalimat "bukan peluang terbakar" | dev + DevTools Performance |
| T41 | Hero Kesiapan | S | T40, T23, T30 | `app/app/(main)/page.tsx`, `app/components/hero/*` (ReadinessRing, UrusDulu, TaskSummary, ElNinoToggle) | 03 §3.1; sakelar El Niño lewat query `?elnino=1`; klik kabupaten menyaring | angka = `/api/ringkasan`; state kosong/galat ada | G3 langkah 0:00–0:45 |
| T42 | Peta Riwayat | S | T40, T30 | `app/app/(main)/peta/page.tsx`, `app/components/peta/*` (Filters, BlockList virtualized) | 03 §3.2 tanpa simulasi; filter sinkron ke URL | filter mengubah peta & daftar | manual |
| T43 | Kartu Lokasi | S | T40, T30 | `app/app/(main)/blok/[id]/page.tsx`, `app/components/blok/*` (AnswerCard, YearStrip, DotIndicator, Timeline) | 03 §3.3; jawaban 4 baris dari `jawaban`; lencana demo pada kondisi | layak 375 px; 404 untuk id tak ada | manual 1280/375 |
| T44 | Papan Tugas | S | T31, T23 | `app/app/(main)/tugas/page.tsx`, `app/components/tugas/*` (TaskBoard, TaskCard, ApproveDialog), `app/lib/wa.ts` | 03 §3.4 tanpa dialog tolak (T51); `wa.ts` membangun `https://wa.me/<no>?text=` dengan `encodeURIComponent` | setujui → status berubah → tombol WA membuka tautan benar | manual + smoke |
| T45 | **Gate G3** | O | T40–T44 | — | jalankan demo 0:00–2:15; cocokkan angka hero dengan SQL manual | G3 | §3 |

### F5 · Layar P1

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T50 | Simulasi | S | T42, T21 | `app/components/peta/SimulationDrawer.tsx`, `app/components/charts/CoverageChart.tsx` | laci 03 §3.2; `capacityPlan`; kurva dari `coverage_curve`; "Usulkan N tugas" → `POST /api/tugas` massal (maksimal 50 per klik) | geser slider < 100 ms; kalimat X% sesuai kurva | manual + profiler |
| T51 | Tolak dengan alasan | S | T44 | `app/components/tugas/RejectDialog.tsx`, `app/app/api/alasan/sortir/route.ts`, `app/lib/reasons.ts` | 03 §3.4; sortir kata kunci dulu (T60 menambah AI); simpan `alasan_sumber` | teks "jembatan putus" → `akses_terputus` | smoke |
| T52 | Putar Ulang 2023 | S | T40, T30 | `app/app/(main)/bukti/page.tsx`, `app/components/bukti/ReplayPlayer.tsx` | 03 §3.5; data `replay`, `replay_block`, `replay_curve`; animasi 3 langkah, hormati reduced motion | angka 9,3 / 46,2 / 8,9 tampil persis; batasan tampil | manual |
| T53 | Cek Data | S | T30 | `app/app/(main)/data/page.tsx`, `app/components/data/*` | 03 §3.6; histogram `full_obs_years`; hitungan alasan tolak dari ops | semua asumsi 01 §5.4–5.5 tampil | manual |
| T54 | TABAT Lapangan | S | T32, T23 | `app/app/lapangan/page.tsx`, `app/app/lapangan/layout.tsx`, `app/components/field/*` (FieldForm, SyncPill), `app/lib/queue.ts` | 02 §9 dan 03 §3.7; sakelar "Mode luring (demo)"; kompres foto lewat canvas → JPEG 800 px q 0,6 | antrean bertahan saat reload; terkirim saat daring; status tugas berubah otomatis | manual di 390 px |
| T55 | **Gate G4** | O | T50–T54 | — | demo 6 menit penuh; grep kata terlarang | G4 | §3 |

### F6 · AI dan P2

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T60 | Lapisan AI | S | T51 | `app/lib/ai.ts`, update `api/alasan/sortir`, `app/app/api/ringkasan-ai/route.ts` | 02 §8; SDK Anthropic; `claude-haiku-5-5` untuk sortir (JSON enum), `claude-sonnet-5-5` untuk ringkasan; batas per jam, cache; fallback templat; label sumber di UI | tanpa kunci → templat; dengan kunci → enum valid | G5 |
| T61 | Ekspor CSV | H | T30 | `app/app/api/ekspor.csv/route.ts` | kolom: block_id, kabupaten, kelas, tenggat, status, lon, lat, is_demo | berkas terunduh, header Bahasa Indonesia | `curl` |
| T62 | Logo & manifest | S | T23 | `app/app/icon.svg`, `app/app/manifest.ts`, `app/public/sw.js` (opsional) | glif tabat 04 §7; manifest untuk `/lapangan` | ikon tampil di tab | manual |
| T63 | Tur pengenalan | S | G4 | `app/components/tour/*` | 5 langkah: hitung mundur, Urus ini dulu, Kartu Lokasi, Tugas, Putar Ulang; bisa ditutup, tidak muncul lagi (localStorage dengan try/catch) | tidak mengganggu demo setelah ditutup | manual |
| T64 | **Gate G5** | O | T60–T63 | — | G5 | G5 | §3 |

### F7 · QA dan rilis

| ID | Judul | M/E | Dep | Berkas | Langkah | Kriteria terima | Verifikasi |
|---|---|---|---|---|---|---|---|
| T70 | Grep kejujuran & copy | H | G4 | laporan saja | grep kata terlarang; cek setiap angka dari ops berdampingan dengan `DemoBadge`; cek format angka `id-ID` | nol pelanggaran, atau daftar pelanggaran untuk Sonnet | grep |
| T71 | Playwright smoke | S | G4 | `app/tests/smoke.spec.ts`, `app/playwright.config.ts` (`channel: 'msedge'`) | login demo → 7 halaman → setujui tugas → kunjungan luring→daring → reset | lulus 3× berturut-turut | `npx playwright test` |
| T72 | Aksesibilitas & 375 px | S | G4 | perbaikan di komponen terkait | keyboard penuh, kontras, `aria-label`, fokus dialog, tanpa scroll horizontal di 375 px | checklist 02 §10 hijau | manual + Lighthouse a11y ≥ 90 |
| T73 | Kinerja | S | G4 | perbaikan terkait | lazy-load peta, ukuran GeoJSON, cache header `public/geo` | LCP < 2,5 s (build produksi lokal) | Lighthouse |
| T74 | Audit angka | O | T70–T73 | `docs/AUDIT_ANGKA.md` | baca teks setiap layar (Playwright `innerText`), cocokkan dengan `check_numbers` dan registri riset | nol selisih | — |
| T75 | Tangkapan layar poster | H | T74 | `docs/screens/*.png` | reset demo → Playwright screenshot sesuai 04 §10 | 6 berkas | `ls docs/screens` |
| T76 | Deploy | O + user | T74 | `vercel.json` bila perlu | **minta izin user**: akun Vercel, env, matikan Deployment Protection; deploy; uji incognito | G6 | URL publik |
| T77 | Dokumentasi akhir | H | T76 | `README.md`, `docs/PROGRESS.md`, `docs/03_APP_FLOW.md` §6 (angka final) | isi URL, cara menjalankan, angka demo final dari layar | dokumen sinkron dengan app | baca ulang |

## 7. Perkiraan beban

| Fase | Task | Sonnet | Haiku | Opus |
|---|---|---|---|---|
| F0 | 3 | 1 | 1 | 1 |
| F1 | 9 | 7 | 1 | 1 |
| F2–F3 | 10 | 7 | 2 | 1 |
| F4 | 6 | 5 | 0 | 1 |
| F5 | 6 | 5 | 0 | 1 |
| F6 | 5 | 3 | 1 | 1 |
| F7 | 8 | 3 | 3 | 2 |
| **Total** | **47** | **31** | **8** | **8** |

Jalur kritis: T00 → T01 → T10 → T11 → T14 → T16 → T17 → G1 → T20 → T30 → T40 → T41 → G3 → T52 → G4 → T74 → T76.

## 8. Risiko pelaksanaan

| Risiko | Tanda | Respons orkestrator |
|---|---|---|
| Izin unduh GADM L2 tertunda | T12 terhalang | jalankan T13–T17 dengan `kab_id` = provinsi sementara; label peta per provinsi; kembali ke T12 setelah izin |
| `blocks.geojson` terlalu besar | > 1,5 MB | bulatkan ke 4 desimal; gabungkan blok `LAIN` menjadi satu poligon latar |
| MapLibre bermasalah di build | galat SSR | pastikan `dynamic(..., { ssr: false })`; fallback daftar |
| better-sqlite3 gagal di Vercel | 500 saat cold start | pastikan Node runtime (bukan edge) dan `outputFileTracingIncludes`; uji `next start` lokal |
| Seed terlalu "bagus" atau "jelek" | hero tidak bercerita | ubah parameter seed saja (bukan angka riset), jalankan ulang G1 |
| Eksekutor mengarang angka | angka tidak ada di DB | T74 menangkap; tolak task, ulangi dengan sumber angka eksplisit |
