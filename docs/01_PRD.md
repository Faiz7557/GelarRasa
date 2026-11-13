# 01 · PRD TABAT (Product Requirements Document)

Turunan dari [00_BRIEF](00_BRIEF.md). Versi 1.0 · 13 Nov 2026.

## 1. Tujuan produk

| Tujuan | Ukuran di prototype |
|---|---|
| G1. Mengarahkan pemeriksaan ke kantong berulang lebih dulu | Hero menampilkan Prioritas 1 (358 blok) dan daftar "Urus ini dulu" yang berbeda per kabupaten |
| G2. Menutup celah air dan pemeliharaan | Setiap blok prioritas punya Kartu Lokasi dengan isian muka air (ambang 40 cm) dan kondisi tabat |
| G3. Menutup celah kewenangan | Setiap tugas punya satu pemilik, satu tenggat, dan satu bukti; alur persetujuan oleh satu koordinator |
| G4. Membuktikan arah prioritas dengan data sendiri | Layar Putar Ulang 2023: 9,3% blok → 46,2% jejak 2023 vs acak 8,9% |
| G5. Jujur tentang batasan | Layar Cek Data + label "data demo fiktif" pada semua data lapangan |

**Bukan tujuan:** meramal kebakaran, mengukur emisi, menggantikan SiPongi/BMKG, mengelola anggaran, mengelola izin konsesi.

## 2. Persona (fiktif)

| ID | Persona | Peran | Kebutuhan utama | Layar utama |
|---|---|---|---|---|
| `koordinator` | **Rina Wulandari**, Koordinator Pencegahan Karhutla, DLH Provinsi / KPH | pemilik TABAT | tahu apakah wilayahnya siap sebelum Agustus, menyetujui usulan, menetapkan tenggat | Kesiapan, Tugas |
| `regu` | **Agus Saputra**, Ketua Regu MPA / Manggala Agni | pemeriksa lapangan | tahu blok mana yang diperiksa minggu ini, mencatat hasil tanpa sinyal | TABAT Lapangan, Kartu Lokasi |
| `pengelola` | **Hadi Prayitno**, Kepala Desa / pengelola lahan | perawat tabat | tahu tabat mana yang harus diperbaiki dan kapan, mengirim foto bukti | Tugas (tampilan sederhana), Lapangan |
| `kampus` | **Dewi Anggraini**, mitra kampus (analis data) | pengelola data | memperbarui peta tiap tahun, memverifikasi bukti, membaca alasan tolak | Peta Riwayat, Cek Data, Bukti |

Pengguna sekunder: juri lomba (membuka demo), pimpinan daerah (membaca ringkasan).

## 3. Cerita pengguna utama

1. Sebagai **koordinator**, saya membuka TABAT di bulan Juni dan dalam 10 detik tahu berapa persen blok Prioritas 1 sudah siap, berapa hari lagi menuju 1 Agustus, dan kabupaten mana yang tertinggal.
2. Sebagai **koordinator**, saya menyetujui usulan pemeriksaan, memilih regu, dan TABAT membuat pesan WhatsApp berisi daftar blok, koordinat, dan tenggat.
3. Sebagai **koordinator**, saya bisa menolak usulan dengan alasan ("akses terputus", "di luar kewenangan"), dan alasan itu tercatat untuk penyusunan prioritas tahun depan.
4. Sebagai **regu**, saya membuka TABAT Lapangan di ponsel, melihat blok tugas saya diurutkan, mengisi muka air, kondisi tabat, dan foto, lalu data terkirim otomatis saat ada sinyal.
5. Sebagai **pengelola lahan**, saya menerima tugas perbaikan tabat, menandai selesai, dan mengunggah foto sebelum–sesudah.
6. Sebagai **kampus**, saya melihat blok dengan kelengkapan pengamatan rendah dan memastikan prioritasnya tidak diturunkan hanya karena datanya bolong.
7. Sebagai **juri**, saya bisa memahami dalam satu layar kenapa daftar prioritas ini masuk akal (Putar Ulang 2023).

## 4. Fitur dan prioritas

Aturan potong: kalau waktu habis, potong dari bawah (P2 dulu). P0 wajib live sebelum P1 dikerjakan.

### P0 · wajib

| ID | Fitur | Deskripsi | Kriteria terima |
|---|---|---|---|
| F-01 | **Kesiapan (hero)** `/` | Hitung mundur ke 1 Agustus; persen siap Prioritas 1 dan 2; peta Kalteng–Kalsel berwarna per kabupaten dengan label "X dari Y blok prioritas belum siap"; daftar "Urus ini dulu" (5 blok); ringkasan tugas terlambat | Angka sama dengan query SQL di 05 §4; klik kabupaten menyaring daftar; klik blok membuka Kartu Lokasi |
| F-02 | **Peta Riwayat** `/peta` | Peta blok 2,3 km: warna tipe, garis hotspot, batas jendela studi, area di luar jendela; filter kelas prioritas, kabupaten, kelengkapan pengamatan; legenda | 5.633 blok dirender < 2 detik di laptop; filter mengubah peta dan daftar |
| F-03 | **Kartu Lokasi** `/blok/[id]` | Jawaban 4 baris di atas: *riwayat · kondisi · tindakan · tenggat*; strip 10 tahun; indikator tipe; kunjungan terakhir; muka air terakhir vs ambang 40 cm; kondisi tabat; tombol "Buat tugas" | Semua indikator dari `blocks` dan `block_years`; label "demo" pada data lapangan |
| F-04 | **Tugas** `/tugas` | Papan 5 kolom: Usulan → Disetujui → Diperiksa → Dirawat → Terbukti; kartu berisi blok, kelas, pemilik, tenggat; Setujui / Tolak / Tandai selesai sesuai peran | Status tersimpan di SQLite ops; peran menentukan tombol yang muncul |
| F-05 | **Masuk sebagai persona** `/masuk` | Tombol "Masuk sebagai demo" (koordinator) + ganti persona di header | Sesi cookie; tidak ada data pribadi nyata |
| F-06 | **Pipeline data** | Python membangun `tabat.db` dari riset; `check_numbers.py` memvalidasi | Lulus seluruh assert di 02 §5 |

### P1 · penting

| ID | Fitur | Deskripsi | Kriteria terima |
|---|---|---|---|
| F-07 | **Putar Ulang 2023** `/bukti` | Animasi peta: prioritas 2015–2022 muncul, lalu jejak 2023 jatuh di atasnya; kartu angka 9,3% → 46,2% vs acak 8,9%; kurva cakupan (N blok → % jejak 2023 tertangkap) | Angka dari tabel `replay`; batasan tertulis di layar |
| F-08 | **Simulasi** (panel di `/peta`) | "Tahun ini El Niño?" (ya: Prioritas 2 ikut wajib sebelum Agustus); "Regu sanggup N kunjungan" (slider 50–600): daftar terurut dan kurva cakupan luas berulang | Hitung di klien dari data yang sudah dimuat; respons < 100 ms |
| F-09 | **Tolak dengan alasan** | Dialog 5 alasan + kolom teks bebas; AI menyortir teks ke salah satu alasan, fallback kata kunci | Alasan tersimpan; tampil di Cek Data sebagai "yang dipelajari" |
| F-10 | **Kirim ke WhatsApp** | Tombol pada tugas disetujui: membuka `wa.me` dengan teks siap kirim (blok, koordinat, tenggat, tautan Kartu Lokasi) | Tidak mengirim apa pun tanpa tindakan pengguna |
| F-11 | **Cek Data** `/data` | Asumsi (tenggat, ambang 40 cm, lead akses), kelengkapan pengamatan, masalah data, apa yang TABAT tidak lakukan, alasan tolak terkumpul | Semua asumsi bisa dibaca; tidak ada angka tanpa sumber |
| F-12 | **TABAT Lapangan** `/lapangan` | Tampilan ponsel: daftar tugas regu, formulir kunjungan (muka air cm, kondisi tabat, akses, foto, catatan), antre offline, sinkron otomatis | Bekerja di 375 px; antrean bertahan saat offline (localStorage); terkirim saat online |

### P2 · bila sempat

| ID | Fitur | Deskripsi |
|---|---|---|
| F-13 | Ringkasan AI untuk pimpinan | Satu paragraf status kesiapan yang ditulis AI dari angka DB, dengan label sumber |
| F-14 | Ekspor CSV | Daftar blok prioritas + tugas untuk dinas (format sederhana) |
| F-15 | Tur pengenalan | 5 langkah tooltip untuk juri pertama kali |
| F-16 | Mode Bahasa Inggris | Teks UI dwibahasa |
| F-17 | PWA terpasang | Manifest + service worker untuk `/lapangan` |

**Sengaja dipotong:** peta 3D, prediksi cuaca, integrasi SiPongi langsung, notifikasi push, multi-tenant, login sungguhan.

## 5. Aturan bisnis

### 5.1 Kelas prioritas (dari Bab III, tetap)

| Kelas | Definisi | Blok |
|---|---|---|
| `P1` | tipe = 3 **dan** hotspot = true | 358 |
| `P2` | tipe = 3 **dan** hotspot = false | 166 |
| `CEK` | tipe = 2 (jejak di luar tahun El Niño) | 119 |
| `PANTAU` | tipe = 1 | 1.198 |
| `LAIN` | tipe = 0 (tanpa jejak; termasuk blok hotspot tanpa jejak) | 3.792 |

Total 5.633. Jumlah per kelas wajib dicek di `check_numbers.py`.

### 5.2 Urutan dalam kelas

Urutkan berdasarkan: `repeated_cells` turun → `last_year` turun → `gi_z` turun → `block_id` naik. Tanpa skor gabungan berbobot, supaya bisa dijelaskan dalam satu kalimat.

### 5.3 Blok "siap"

Blok prioritas dihitung **siap** bila sebelum tenggat ada kunjungan dengan: muka air terisi, kondisi tabat terisi, dan tugas pemeriksaan berstatus `terbukti`. Kesiapan = siap / total blok wajib. Wajib = P1, ditambah P2 bila mode El Niño aktif.

### 5.4 Tenggat ("batas aman periksa")

`tenggat = 1 Agustus − lead_akses − 7 hari jeda`, dengan `lead_akses` = 7 (jalan), 14 (sungai), 21 (sulit) hari. Kelas akses adalah **data demo** dan asumsinya tampil di Cek Data.

### 5.5 Status muka air

`muka_air_cm` diukur dari permukaan gambut ke bawah. ≤ 40 cm = aman (hijau); > 40 cm = di bawah ambang kerusakan (merah). Rujukan ambang 40 cm: PP 57/2016 dan Pantau Gambut 2024.

### 5.6 Alasan tolak

`akses_terputus`, `sudah_dibasahi`, `bukan_gambut`, `di_luar_kewenangan`, `tabat_sudah_baik`, `lainnya`.

## 6. Metrik keberhasilan

| Konteks | Metrik |
|---|---|
| Prototype (lomba) | juri memahami hero dalam satu layar; skrip demo 6 menit tanpa error; semua angka lulus `check_numbers.py` |
| Pilot F0 (roadmap) | ≥ 80% blok P1 siap sebelum 1 Agustus; ≥ 70% tugas ditutup dengan bukti; alasan "bukan gambut / data salah" < 20% |

## 7. Batasan dan asumsi

- Data riwayat hanya jendela h29v09 (92,5% Kalteng, 75,1% Kalsel). Blok di luar jendela tidak dinilai.
- Data lapangan, akses, dan tugas seluruhnya demo fiktif, dibuat deterministik dari seed (lihat 05 §3.3).
- Tanggal "hari ini" demo dikunci di `meta.as_of = 2027-06-01` (musim 2027), sehingga hitung mundur bermakna saat dinilai. Bisa diubah di `meta`.
- Kabupaten diambil dari GADM 4.1 level 2. KPH belum tersedia; disebut di roadmap.

## 8. Risiko produk

| Risiko | Mitigasi |
|---|---|
| Juri mengira data lapangan nyata | Pita "Data lapangan: demo fiktif" di setiap layar yang memakainya |
| Juri membaca hotspot sebagai ramalan | Kalimat tetap di legenda: "riwayat pengulangan, bukan peluang terbakar" |
| Peta lambat | Geometri disederhanakan di pipeline; satu sumber GeoJSON; render WebGL |
| Terlalu banyak fitur | Aturan potong §4; hero tunggal |
