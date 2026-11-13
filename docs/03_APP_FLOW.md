# 03 · App Flow TABAT

Turunan dari [01_PRD](01_PRD.md). Tampilan visual di [04_DESIGN_BRIEF](04_DESIGN_BRIEF.md).

> Angka contoh di dokumen ini (mis. "129 dari 358", "Blok 4123", "Pulang Pisau", "62 cm", "84 belum siap") **ilustratif**. Nilai sebenarnya berasal dari `tabat.db` setelah G1, dan T77 menggantinya dengan angka final. Yang sudah pasti: 358 blok P1, 61 hari dari 1 Jun ke 1 Agu 2027, dan Putar Ulang 522 blok / 9,3% / 46,2% / 8,9%.

## 1. Peta layar

```
/masuk ──► (main) shell
            ├── /                 Kesiapan            "Siap sebelum 1 Agustus?"
            ├── /peta             Peta Riwayat        "Di mana mulai?"
            │     └── panel Simulasi (El Niño, kapasitas)
            ├── /tugas            Tugas               "Apa yang harus dilakukan?"
            ├── /blok/[id]        Kartu Lokasi        (dibuka dari mana saja)
            ├── /bukti            Putar Ulang 2023    "Bisa dipercaya?"
            └── /data             Cek Data            "Bisa dipercaya?"
/lapangan  (layout ponsel tersendiri, tanpa sidebar)  TABAT Lapangan
```

## 2. Shell dan navigasi

Sidebar kiri (desktop) atau bar bawah (≤ 768 px), dikelompokkan sebagai pertanyaan seperti Sparekit:

| Grup (pertanyaan) | Item | Ikon lucide |
|---|---|---|
| Siap sebelum Agustus? | Kesiapan | `CalendarClock` |
| Di mana mulai? | Peta Riwayat | `Map` |
| Apa yang harus dilakukan? | Tugas (badge jumlah terlambat) | `ListTodo` |
| Bisa dipercaya? | Putar Ulang 2023 · Cek Data | `History` · `ShieldCheck` |
| (bawah) | TABAT Lapangan (buka di ponsel) | `Smartphone` |

Header: logo TABAT · hitung mundur kecil "61 hari menuju 1 Agu" · pemilih persona (avatar + nama + peran) · tombol "Reset demo" (koordinator saja).

Pita tetap di atas konten: **"Data lapangan, tugas, dan akses: demo fiktif. Riwayat jejak: MODIS–BIG 2015–2024."**

Langkah alur T-A-B-A-T tampil sebagai stepper kecil di atas halaman Peta, Kartu Lokasi, dan Tugas (setara "decide steps" Sparekit): **Telusuri** (Peta) → **Amati** (Kartu Lokasi/Lapangan) → **Bagi tugas** (Tugas: usulan→disetujui) → **Aksi** (diperiksa→dirawat) → **Tuntaskan** (terbukti).

## 3. Spesifikasi layar

### 3.1 `/` Kesiapan (hero)

| Area | Isi | Interaksi |
|---|---|---|
| Kepala | Judul "Siap sebelum 1 Agustus?" · hitung mundur besar (hari) · sakelar "Tahun ini El Niño?" | sakelar mengubah himpunan wajib (P1 → P1+P2) dan semua angka |
| Kartu kesiapan | persen siap (cincin) + "129 dari 358 blok prioritas siap" + rincian: diperiksa / air diukur / tabat tercatat / terbukti | klik membuka Tugas tersaring |
| Peta kabupaten | choropleth kabupaten Kalteng–Kalsel menurut % siap; label "Pulang Pisau · 84 belum siap"; batas jendela studi | hover: tooltip; klik: saring daftar dan kartu |
| Urus ini dulu | 5 baris: blok, kabupaten, kelas, tenggat, urgensi (warna + teks), satu alasan | klik baris → Kartu Lokasi; tombol "Buat tugas" bila belum ada |
| Ringkasan tugas | terlambat · minggu ini · menunggu persetujuan | klik → Tugas tersaring |
| Kaki | "Kenapa blok ini didahulukan?" → Putar Ulang 2023 (46,2% vs 8,9%) | tautan |

State: memuat (skeleton kartu), ops kosong (angka 0% + pesan "Belum ada kunjungan tercatat"), galat API (kartu galat + tombol coba lagi).

### 3.2 `/peta` Peta Riwayat

| Area | Isi |
|---|---|
| Peta (70% lebar) | blok 2,3 km diwarnai tipe; garis tepi hotspot; batas kabupaten tipis; batas jendela studi putus-putus; area di luar jendela abu |
| Filter (atas peta) | kelas (P1/P2/CEK/PANTAU), kabupaten, "kelengkapan pengamatan < 4 tahun", status (belum/sedang/siap) |
| Panel kanan | daftar blok terurut (virtualized), legenda, kalimat tetap "riwayat pengulangan, bukan peluang terbakar" |
| Simulasi (laci bawah) | sakelar El Niño · slider "Regu sanggup N kunjungan sebelum Agustus" (50–600) · grafik kurva cakupan dengan titik N · kalimat "N kunjungan menyentuh X% luas berulang 2015–2024" · tombol "Usulkan N tugas" (koordinator) |

Interaksi: klik blok → popover ringkas (kelas, tahun berjejak, status) + tombol "Buka Kartu Lokasi". Zoom/pan bebas; tombol "Kembali ke jendela studi".

### 3.3 `/blok/[id]` Kartu Lokasi

Susunan atas ke bawah (meniru halaman part Sparekit: jawaban dulu, alasan kemudian):

1. **Judul:** "Blok 4123 · Pulang Pisau · Prioritas 1" + lencana tipe + lencana hotspot.
2. **Jawaban 4 baris** (kartu besar):
   - *Riwayat:* "Berjejak 3 dari 10 tahun, terakhir 2023, 44% selnya berulang."
   - *Kondisi:* "Muka air 62 cm (di bawah ambang 40 cm) · tabat TB-4123-1 rembes" (demo) atau "Belum diperiksa tahun ini."
   - *Tindakan:* "Periksa dan ukur muka air; perbaiki tabat rembes."
   - *Tenggat:* "Batas aman periksa 11 Jul 2027 (akses sungai)".
3. **Strip 10 tahun:** 10 kotak 2015–2024; warna = ada jejak; tahun El Niño bertanda; angka sel positif saat hover.
4. **Peta mini blok** + tabat (titik) + kunjungan (titik).
5. **Indikator** (bulatan persentil seperti kartu tipe Bab III): bagian berjejak, berulang, tahun positif terbanyak, jejak El Niño, jejak terakhir, kelengkapan pengamatan (dengan peringatan bila < 4).
6. **Linimasa** kunjungan dan tugas (demo).
7. **Aksi:** "Buat tugas" · "Buka di TABAT Lapangan" · "Salin koordinat".

Mobile 375 px: kartu jawaban tetap di atas, peta mini di bawahnya.

### 3.4 `/tugas` Tugas

- Papan 5 kolom + kolom "Ditolak" yang dilipat. Kartu: blok, kabupaten, jenis, pemilik (avatar), tenggat (merah bila lewat), lencana demo.
- Filter: pemilik, kabupaten, urgensi, "hanya milik saya".
- **Setujui** (koordinator, pada kartu `usulan`): dialog pilih pemilik + tenggat (default dari `deadlineFor`) → status `disetujui` → tombol **Kirim ke WhatsApp** muncul.
- **Tolak**: dialog 5 alasan + "Atau tulis dengan kata sendiri" + tombol "Sortir" (AI/kata kunci) → simpan.
- **Tandai terbukti**: hanya bila ada kunjungan berfoto; dialog menampilkan foto dan muka air.
- Drag antar kolom tidak dipakai (status berubah lewat tombol agar aturan peran jelas).

### 3.5 `/bukti` Putar Ulang 2023

1. Kalimat kepala: "Seandainya TABAT dipakai akhir 2022…"
2. Peta animasi 3 langkah (tombol Putar / langkah manual):
   - Langkah 1: semua blok berjejak 2015–2022 (abu).
   - Langkah 2: 522 blok berulang 2015–2022 menyala (oranye) = daftar prioritas akhir 2022.
   - Langkah 3: jejak 2023 jatuh (titik merah); yang mengenai blok prioritas dihitung.
3. Kartu angka: **9,3% blok → 46,2% jejak 2023** vs acak **8,9%** (≈ 5×).
4. Kurva: N blok teratas → % jejak 2023 tertangkap, dengan garis acak.
5. Kotak batasan: satu tahun uji; bukti positif MODIS bukan luas terbakar pasti; jendela studi; mengukur arah prioritas, bukan dampak pemeriksaan.

### 3.6 `/data` Cek Data

Bagian: **Asumsi** (tanggal hari ini demo, tenggat 1 Agu, lead akses 7/14/21 hari, jeda 7 hari, ambang 40 cm) · **Sumber data** (MODIS MCD64A1.061, BIG layer 6, GWIS, GADM 4.1, kutipan eksternal dengan status) · **Kelengkapan pengamatan** (histogram `full_obs_years`, kalimat "blok tanpa jejak bukan bukti bebas kebakaran") · **Yang dipelajari dari penolakan** (hitungan per alasan + contoh catatan) · **Apa yang TABAT tidak lakukan** · **Pilihan kami dan alasannya** (kenapa blok 2,3 km, kenapa tanpa skor berbobot, kenapa tanpa prediksi).

### 3.7 `/lapangan` TABAT Lapangan (ponsel)

1. Kepala: persona, status sinyal (Daring/Luring), "3 kunjungan menunggu kirim".
2. Daftar tugas saya, urut tenggat; kartu menampilkan jarak bila GPS ada.
3. Formulir kunjungan (satu layar, gulir):
   - Blok (terisi dari tugas) · jenis (periksa/rawat)
   - Muka air (cm), angka besar dengan tombol −/+ 5; indikator langsung aman/kering
   - Tabat: pilih dari daftar blok atau "tidak ada"; kondisi (4 tombol besar)
   - Akses aktual · foto (kamera) · catatan
   - **Simpan** → masuk antrean; toast "Tersimpan di ponsel, terkirim saat ada sinyal".
4. Simulasi luring untuk demo: sakelar "Mode luring (demo)" di menu.

## 4. Matriks peran

| Aksi | koordinator | regu | pengelola | kampus |
|---|---|---|---|---|
| Lihat semua layar | ✓ | ✓ | ✓ | ✓ |
| Buat usulan tugas | ✓ | — | — | ✓ |
| Setujui / tolak usulan | ✓ | — | — | — |
| Kirim ke WhatsApp | ✓ | — | — | — |
| Simpan kunjungan `periksa` | ✓ | ✓ | — | — |
| Simpan kunjungan `rawat` | ✓ | — | ✓ | — |
| Tandai terbukti | ✓ | — | — | ✓ |
| Reset demo | ✓ | — | — | — |

Tombol yang tidak diizinkan tidak ditampilkan; API tetap menolak (403).

## 5. Alur per persona

### 5.1 Koordinator: dari hero ke tugas disetujui

```
/ (36% siap, 61 hari) → klik kabupaten tertinggal → Urus ini dulu: Blok 4123 (terlambat)
→ /blok/4123: jawaban 4 baris → "Buat tugas" → toast "Usulan dibuat"
→ /tugas: kartu di Usulan → Setujui (pemilik Agus, tenggat 11 Jul) → Kirim ke WhatsApp (wa.me terbuka)
```

### 5.2 Koordinator: menolak dengan alasan

```
/tugas → kartu usulan → Tolak → tulis "jembatan ke blok putus sejak Mei" → Sortir → "Akses terputus" (sumber: AI)
→ Simpan → kartu pindah ke Ditolak → /data "Yang dipelajari": akses terputus +1
```

### 5.3 Regu: kunjungan luring

```
Ganti persona → Agus → /lapangan → tugas Blok 4123 → isi muka air 62, tabat rembes, foto
→ Mode luring aktif → Simpan (antre 1) → matikan mode luring → terkirim → status tugas "diperiksa"
```

### 5.4 Pengelola: perbaiki tabat

```
Ganti persona → Hadi → /lapangan → tugas rawat tabat → kondisi "baik", foto sesudah → kirim → status "dirawat"
```

### 5.5 Kampus: bukti dan verifikasi

```
Ganti persona → Dewi → /tugas (kolom Dirawat) → Tandai terbukti (foto terlihat) → hero: kesiapan naik
→ /data: kelengkapan pengamatan, asumsi
```

## 6. Skrip demo 6 menit (untuk juri)

Persiapan: masuk sebagai koordinator, tekan **Reset demo**, mode El Niño mati.

| Menit | Layar | Ucapan inti | Tindakan |
|---|---|---|---|
| 0:00 | `/` | "Kebakaran gambut kembali ke tempat yang sama. TABAT menjawab satu pertanyaan: siap sebelum 1 Agustus?" | tunjuk hitung mundur, persen siap |
| 0:45 | `/` | "Kabupaten ini tertinggal; lima blok ini harus diurus dulu." | klik kabupaten, tunjuk Urus ini dulu |
| 1:30 | `/blok/[id]` | "Satu blok: riwayat, kondisi, tindakan, tenggat." | tunjuk strip 10 tahun dan tenggat |
| 2:15 | `/tugas` | "Satu pemilik, satu tenggat, satu bukti." | Setujui → Kirim ke WhatsApp |
| 3:00 | `/tugas` | "Kalau tidak setuju, alasannya tercatat." | Tolak dengan teks bebas → Sortir |
| 3:40 | `/lapangan` (ganti ke Agus) | "Regu mencatat di lapangan, tanpa sinyal pun bisa." | isi, simpan luring, lalu daring |
| 4:30 | `/peta` | "Kalau tahun ini El Niño, atau regu hanya sanggup 200 kunjungan?" | sakelar + slider |
| 5:10 | `/bukti` | "Kenapa percaya urutan ini? Seandainya dipakai akhir 2022: 9% blok menyentuh 46% jejak 2023, acak hanya 9%." | Putar |
| 5:45 | `/data` | "Semua asumsi dan batasan terbuka; data lapangan di demo ini fiktif." | tunjuk pita demo |

### 6.1 Angka final demo (setelah Reset demo, diisi T77, 13 Nov 2026)

| Menit | Yang tampil di layar |
|---|---|
| 0:00 | **61 hari** menuju 1 Agu; kesiapan **34,4%** = **123 dari 358** blok Prioritas 1 (diperiksa 150, air diukur 140, tabat tercatat 140, terbukti 123); 10 tugas terlambat, 14 menunggu persetujuan |
| 0:45 | kabupaten paling tertinggal: **Sukamara** (25 belum siap, 7,4%), lalu Katingan (10,0%) dan Barito Selatan (17,6%); Urus ini dulu dipimpin **Blok 50980 · Pulang Pisau** (terlambat, tenggat 24 Mei 2027) |
| 1:30 | `/blok/50980`: berjejak 5 dari 10 tahun, terakhir 2023, 96% selnya berulang; muka air 61 cm (di bawah ambang 40 cm), tabat TB-50980-1 rusak |
| 2:15–3:00 | setujui usulan (pemilik Agus) → tautan `wa.me`; tolak usulan lain dengan "jembatan putus sejak Mei" → disortir **Akses terputus** (kata kunci; AI bila `ANTHROPIC_API_KEY` diisi) |
| 4:30 | El Niño: wajib 358 → **524** blok (kesiapan 31,5%); 200 kunjungan menyentuh **58,3%** luas berulang 2015–2024 |
| 5:10 | `/bukti`: **9,3% blok → 46,2% jejak 2023**, acak **8,9%** (≈ 5×); kantong: 8,2% blok memuat 77,8% luas berulang; Moran's I 0,69, 2,81× acak |
| 5:45 | `/data`: 95,5% luas terbakar Agu–Okt; 360 dari 524 blok prioritas teramati lengkap < 4 tahun |

## 7. Status kosong dan galat (wajib ada)

| Layar | Kosong | Galat |
|---|---|---|
| Kesiapan | "Belum ada kunjungan tercatat musim ini." | kartu galat + coba lagi |
| Peta | filter tanpa hasil: "Tidak ada blok dengan filter ini." + reset filter | peta gagal (WebGL mati): tampilkan daftar blok saja + pesan |
| Tugas | kolom kosong: garis putus + teks pendek | toast galat, status tidak berubah |
| Kartu Lokasi | id tidak ada: 404 dengan tautan ke Peta | — |
| Lapangan | tidak ada tugas: "Tidak ada tugas untuk Anda." | antrean gagal: tetap di ponsel, coba lagi otomatis |
