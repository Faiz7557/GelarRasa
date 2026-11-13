# 00 · Brief Proyek TABAT

> Dokumen induk. Semua dokumen lain (01–06) turunan dari brief ini. Bila bertentangan, brief ini yang menang, kecuali 06_IMPLEMENTATION_PLAN menulis keputusan yang lebih baru beserta tanggalnya.

## 1. Konteks lomba

- **Lomba:** Gelar Rasa 2026, Universitas Negeri Surabaya. Tema *Crafting Stories from Data, Blooming into Awareness*. Subtema Aksi Iklim.
- **Judul karya:** *JEJAK API BERULANG: Menjaga Gambut, Menentukan Prioritas Pencegahan.*
- **Posisi TABAT:** Bab IV (Solusi, 40% infografis). Bab III membuktikan bahwa jejak api gambut melonjak di tahun kering dan kembali ke kantong yang sama. TABAT mengubah temuan itu menjadi alat kerja.
- **Bentuk prototype:** dashboard web penuh yang bisa diklik, setara prototype Sparekit di `../caliber-final` (Next.js + SQLite di Vercel). Poster menampilkan tangkapan layarnya; juri bisa membuka tautannya.

## 2. Masalah dalam tiga kalimat

1. Kebakaran gambut berulang di tempat yang sama: di jendela studi, 8,2% blok (hotspot Gi*) memuat 77,8% luas berulang, dan pengulangan 2,81× lebih sering daripada pola acak.
2. Riwayat itu tidak dipakai untuk mengarahkan pemeriksaan: 60% titik restorasi bermuka air lebih dalam dari 40 cm, 70% dari 77 sekat kanal sampel memprihatinkan (Pantau Gambut 2024), dan sejak BRGM dibubarkan (31 Des 2024) kewenangan restorasi tidak jelas.
3. Waktunya sempit dan bisa ditebak: 95,5% luas terbakar Kalteng–Kalsel jatuh pada Agustus–Oktober.

## 3. Solusi dalam satu kalimat

**TABAT memberi tahu, untuk setiap blok gambut yang pernah terbakar berulang, riwayatnya, kondisinya sekarang, apa yang harus dilakukan, oleh siapa, dan sebelum kapan.**

- **Nama:** *tabat* = sekat parit/kanal dalam bahasa lokal Kalimantan Tengah; kegiatannya *menabat* (kearifan Dayak, dipakai program restorasi).
- **Alur kerja T-A-B-A-T:** Telusuri · Amati · Bagi tugas · Aksi · Tuntaskan.
- **Tagline:** *Ingat tempatnya, basahi gambutnya, sebelum Agustus.*

## 4. Hero tunggal

**"Siap sebelum 1 Agustus?"** Halaman pertama menampilkan hitung mundur, persen kesiapan blok prioritas, peta Kalteng–Kalsel berlabel per kabupaten, dan daftar "Urus ini dulu". Semua fitur lain adalah mesin di balik hero ini, bukan produk terpisah (pelajaran dari vonis juri Sparekit: satu hero, satu tagline).

## 5. Bukti utama (harus tampil di app dan poster)

| Bukti | Angka | Sumber |
|---|---|---|
| Putar Ulang 2023 | prioritas dari data 2015–2022 saja: 9,3% blok menangkap 46,2% bukti positif 2023; blok acak 8,9% | `Paket_Riset_Karhutla_Berulang/outputs/bab3/replay_2023.csv` |
| Konsentrasi | 462 blok hotspot (8,2%) memuat 77,8% luas berulang | `registri_angka_bab3.csv` |
| Musim | 95,5% luas terbakar Agu–Okt | idem |
| Pengelompokan | Moran's I 0,69; 2,81× acak (uji toroidal p = 0,011) | idem |

## 6. Aset yang sudah ada

| Aset | Lokasi |
|---|---|
| Data blok lengkap (5.633 blok, tipe, hotspot, indikator) | `Paket_Riset_Karhutla_Berulang/outputs/bab3/panel2_blok_lengkap.csv` |
| Profil tipe, nasional, sorotan eksternal, registri angka | `…/outputs/bab3/*.csv` |
| Raster MODIS MCD64A1 2015–2024 (jendela h29v09) | `…/data/rasters/kalimantan_selatan_{tahun}.tif` |
| Batas gambut BIG, batas provinsi GADM 4.1 | `…/data/boundaries/` |
| GWIS bulanan per provinsi | `…/data/raw/gwis_indonesia_monthly_2002_2025.csv` |
| Generator SVG Figma (warna, font, gaya peta) | `…/scripts/build_figma_svg.py`, `…/outputs/infografis_figma/` |
| Konsep solusi | `../Konsep Solusi TABAT.md` |
| Prototype acuan | `../caliber-final/app` (pola UI, auth demo, AI writer, SQLite ganda) |

## 7. Batas kejujuran (tidak boleh dilanggar)

1. **Data lapangan tidak ada.** Kunjungan, muka air tanah, kondisi tabat, akses, dan tugas adalah **data demo fiktif** yang dibuat seed, dan UI wajib melabelinya begitu. Hanya riwayat jejak (MODIS–BIG), tipe, hotspot, GWIS, dan replay yang data nyata.
2. **Hotspot bukan ramalan.** Tidak boleh ada kata "prediksi kebakaran", "risiko terbakar tahun ini", atau peluang.
3. **Tidak ada klaim dampak emisi.** Pilot hanya mengukur proses.
4. **Jendela studi bukan provinsi.** Peta selalu menampilkan batas jendela studi dan area di luarnya.
5. **AI menulis, tidak menghitung.** Setiap angka berasal dari SQLite; LLM hanya merangkai kalimat dan menyortir alasan, dengan fallback template.
6. Angka eksternal (38%, 60%, 70%) masih kutipan media: tampil dengan label sumber dan status "cek laporan asli".

## 8. Daftar dokumen

| No | Dokumen | Isi |
|---|---|---|
| 00 | Brief (ini) | konteks, masalah, solusi, batas kejujuran |
| 01 | [PRD](01_PRD.md) | persona, fitur, prioritas P0–P2, metrik, kriteria terima |
| 02 | [TRD](02_TRD.md) | arsitektur, stack, pipeline, API, algoritma, non-fungsional |
| 03 | [App Flow](03_APP_FLOW.md) | peta layar, alur per persona, state, skrip demo |
| 04 | [Design Brief](04_DESIGN_BRIEF.md) | arah visual, token, komponen, peta, copy |
| 05 | [Backend Schema](05_BACKEND_SCHEMA.md) | tabel SQLite analitik + operasional, kontrak API |
| 06 | [Implementation Plan](06_IMPLEMENTATION_PLAN.md) | task agentik Opus/Sonnet/Haiku, dependensi, gate |

## 9. Definisi selesai (proyek)

- URL Vercel publik terbuka tanpa login Vercel, masuk lewat tombol "Masuk sebagai demo".
- Hero, Peta Riwayat, Kartu Lokasi, Tugas, Bukti, Cek Data, dan TABAT Lapangan berjalan dengan data dari `tabat.db`.
- `pipeline/check_numbers.py` lulus: setiap angka di §5 sama persis dengan registri riset.
- Skrip demo 6 menit di 03_APP_FLOW §6 bisa dijalankan dari awal sampai akhir tanpa error.
- Tangkapan layar untuk poster tersedia di `tabat-app/docs/screens/`.
