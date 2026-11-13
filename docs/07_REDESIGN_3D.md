# 07 · Rancangan Redesign Visual, Siluet Indonesia, dan Elemen 3D

Status: **disetujui user 13 Nov 2026, diterapkan 14 Nov 2026** (rencana: [superpowers/plans/2026-11-13-redesign-3d.md](superpowers/plans/2026-11-13-redesign-3d.md)) · menggantikan token warna dan tipografi di [04_DESIGN_BRIEF](04_DESIGN_BRIEF.md) §2 setelah disetujui. Aturan kejujuran [00_BRIEF](00_BRIEF.md) §7 tetap berlaku penuh.

## 1. Maksud

User ingin TABAT memakai gaya dan palet poster baru *Jejak Api Berulang* (Grow, Hint of Caramel, Potter's Clay, Weathervane), peta yang setidaknya menampilkan siluet Indonesia, dan elemen 3D yang membuat visualisasi lebih imersif dan, di bagian yang tepat, lebih informatif. Acuan: tampilan 3D Sparekit (`caliber-final`).

Alasan yang terbaca dari konteks: tangkapan layar app masuk ke poster Bab IV, jadi app harus terlihat satu keluarga dengan poster. 3D dipakai untuk menunjukkan *pengulangan di tempat yang sama* secara langsung, bukan sebagai hiasan.

## 2. Sasaran, bukan sasaran, anti-sasaran

**Sasaran**
1. Seluruh UI memakai palet baru dengan kontras teks ≥ 4,5:1.
2. Juri langsung melihat di mana Kalteng–Kalsel berada di Indonesia (siluet + penanda jendela studi).
3. Tiga visual 3D yang masing-masing menjawab satu pertanyaan:
   - **Peta Riwayat 3D**: di mana kantong berulang? (tinggi = jumlah tahun berjejak)
   - **Tumpukan Tahun** di Putar Ulang: apakah api kembali ke tempat yang sama? (lapis per tahun)
   - **Penampang Gambut** di Kartu Lokasi: apa arti muka air 61 cm dan apa fungsi tabat?
4. Semua tangkapan layar poster (04 §10) diambil ulang dengan gaya baru.

**Bukan sasaran**: mode gelap penuh, 3D di TABAT Lapangan (ponsel, baterai), model 3D medan dari DEM, animasi api.

**Anti-sasaran** (gagal walau "jalan"):
- Tinggi menara terbaca sebagai peluang terbakar. Legenda wajib: "tinggi = berapa tahun berjejak 2015–2024, bukan peluang terbakar".
- 3D menjadi satu-satunya cara membaca data. Selalu ada tampilan 2D dan daftar setara.
- Hero melambat (LCP > 2,5 s) karena 3D.
- Penampang gambut memberi kesan kedalaman gambut terukur. Kedalaman adalah ilustrasi dan dilabeli begitu.

## 3. Batasan

- Data nyata vs demo tetap seperti 00 §7; lencana DEMO tetap ada (bentuknya berubah, lihat §4.3).
- Tanpa dependensi baru kecuali disetujui (06 §1.2 aturan 5). TRD §2 menyebut three.js tidak dipakai.
- WebGL mati atau `prefers-reduced-motion` → 2D tanpa animasi kamera.
- `blocks.geojson` tetap satu sumber; berkas geo baru < 150 KB.
- Kata terlarang 04 §6 tetap berlaku.

## 4. Palet dan gaya

### 4.1 Palet inti (dari user)

| Nama | HEX | Peran |
|---|---|---|
| Grow | `#F0E6D3` | latar halaman |
| Hint of Caramel | `#D4943A` | aksen isian, tipe 2, sorotan; **bukan warna teks** |
| Potter's Clay | `#A8432A` | aksen utama, tipe 3, tombol primer |
| Weathervane | `#2C2318` | tinta, sidebar/header gelap, garis hotspot |

Kontras terukur: Weathervane di Grow 12,47:1 · Clay di Grow 4,85:1 · Grow di Clay 4,85:1 · Weathervane di Caramel 5,95:1 · Caramel di Weathervane 5,95:1 · **Caramel di Grow 2,10:1 (gagal)** · Clay di Weathervane 2,57:1 (gagal untuk teks).

### 4.2 Pemetaan token (mengganti 04 §2)

| Token | Lama | Baru | Catatan |
|---|---|---|---|
| `--ground` | `#f6f4ef` | `#F0E6D3` | Grow |
| `--panel` | `#ffffff` | `#FAF5EC` | kartu, sedikit lebih terang dari Grow |
| `--panel-2` | `#faf8f4` | `#E9DCC6` | kartu sekunder |
| `--ink` | `#1f2933` | `#2C2318` | Weathervane |
| `--ink-2` | `#47515c` | `#5C4E3E` | 6,49:1 di Grow |
| `--ink-3` | `#5f6b77` | `#6B5A48` | 5,33:1 di Grow |
| `--line` / `--line-2` | tinta 8% / 16% | Weathervane 10% / 20% | |
| `--aksen` (baru) | — | `#A8432A` | tombol primer, tautan aktif |
| `--sorot` (baru) | — | `#D4943A` | isian sorotan, cincin progres |
| `--tipe-1` | `#9fbfd4` | `#8FA3AD` | abu-biru dingin, tetap beda dari warna hangat |
| `--tipe-2` | `#e9c46a` | `#D4943A` | Caramel |
| `--tipe-3` | `#c8553d` | `#A8432A` | Clay |
| `--hotspot` | `#6b1d1d` | `#2C2318` | garis Weathervane 1,4 px |
| `--gambut` | `#dfe4e8` | `#E2D6BF` | |
| `--luar` | `#e4e7eb` | `#E9DFCC` + arsir | |
| `--laut` | `#eef4f8` | `#DCE3E1` | laut sedikit dingin agar daratan terbaca |
| `--el-nino` | `#c8553d` | `#A8432A` | |

### 4.3 Status dan demo (selalu berteks)

Warna status harus berbeda dari warna data. Karena Clay dan Caramel kini dipakai data, status memakai versi lebih tua/lebih hijau:

| Token | Isi / latar lunak / teks | Kontras teks |
|---|---|---|
| `--telat` | `#8A2A1A` / `#F4D9CF` / `#8A2A1A` | 6,46:1 |
| `--segera` | `#9A6418` / `#F6E3C3` / `#7A4F0F` | 5,65:1 |
| `--siap` | `#3F6B3A` / `#E3EBD9` / `#2F5530` | ≥ 5:1 |
| `--air-aman` / `--air-kering` | `#2F5E7A` / `#8A2A1A` | |
| `--demo` | lencana Weathervane-di-Grow dengan **garis putus-putus** + teks "DEMO" | pola, bukan warna, yang membedakan |

Pita demo: latar Weathervane, teks Grow, garis bawah putus-putus Caramel.

### 4.4 Tipografi dan motif

- Judul: **Bricolage Grotesque 800** (Google Fonts): padat dan tebal, mendekati judul swatch dan banner poster. Angka hero tetap besar (64/68).
- Isi: Inter 400/500 (tetap).
- Label kecil, kode blok, koordinat: **JetBrains Mono 500**, mengikuti gaya label HEX/RGB di swatch.
- Motif poster: header + sidebar Weathervane gelap; judul halaman bergaris bawah Caramel; kartu angka besar dengan pita Clay di kiri. Tanpa foto api; satu gradien bara halus (Weathervane → Clay 12%) hanya di header `/masuk`.

```
┌─ Weathervane ───────────────────────────────────────────────┐
│ TABAT   61 hari menuju 1 Agu        [Rina ▾] [Reset demo]  │
├─────────┬───────────────────────────────────────────────────┤
│ sidebar │  Grow                                            │
│ gelap   │  SIAP SEBELUM 1 AGUSTUS?  (Bricolage 800)        │
│ ▸ Kesia │  ▔▔▔▔▔▔ (Caramel)                                │
│   Peta  │  ┃61┃ hari   ┌ peta + inset siluet Indonesia ──┐ │
│   Tugas │  ┃34,4%┃     └─────────────────────────────────┘ │
└─────────┴───────────────────────────────────────────────────┘
```

## 5. Siluet Indonesia

1. **Lapisan daratan Indonesia** di semua peta: GADM 4.1 level 1 (sudah ada di paket riset) di-*dissolve*, buang pulau < 50 km², `simplify(0.03)`, 3 desimal → `public/geo/indonesia.geojson` (< 150 KB; saat ini 824 KB pada simplify 0,02 tanpa saring pulau). Daratan sedikit lebih gelap dari Grow, laut `--laut`. Zoom awal tetap Kalteng–Kalsel; saat diperkecil seluruh kepulauan terlihat (tombol baru "Lihat Indonesia").
2. **Inset penanda** (SVG statis, tanpa pustaka peta): siluet Indonesia 180×70 px di pojok peta hero, `/peta`, dan `/bukti`; Kalteng–Kalsel diisi Clay, kotak jendela studi bergaris Weathervane. Path SVG dibuat pipeline (`public/geo/indonesia-inset.svg`).
3. **`/masuk`**: siluet besar sebagai latar dengan jendela studi menyala Caramel, tagline di atasnya.

## 6. Elemen 3D: di mana, dan apa yang diberitahukan

| ID | Layar | Visual | Yang dibaca juri | Data | Prioritas |
|---|---|---|---|---|---|
| 3D-1 | `/peta` (sakelar 2D/3D) | **Menara pengulangan**: blok diekstrusi, tinggi = jumlah tahun berjejak (0–10), warna = tipe, tepi Weathervane untuk hotspot; kamera miring 55° | kantong berulang tampil sebagai "pegunungan" di selatan Kalteng | `block_years` (nyata) | P1 |
| 3D-2 | `/bukti` | **Tumpukan tahun**: 10 lapis tipis, satu per tahun 2015–2024; langkah replay menyusun lapis 2015–2022 lalu menjatuhkan lapis 2023 (Clay); blok prioritas berbingkai | api kembali ke kolom yang sama, terlihat sebagai tumpukan lurus | `block_years`, `replay_block` (nyata) | P1 |
| 3D-3 | `/blok/[id]` | **Penampang gambut** isometrik: lapisan gambut, permukaan, muka air terukur vs garis ambang 40 cm, kanal dengan tabat sebagai sekat, kondisi tabat (baik/rembes/rusak/jebol) tergambar | arti "61 cm, di bawah ambang" dan fungsi tabat menahan air | kunjungan & tabat (demo, berlencana); kedalaman gambut ilustrasi | P1 |
| 3D-4 | `/` (opsional, mati bawaan) | kabupaten diekstrusi menurut jumlah blok belum siap, warna menurut % siap | beban kerja per kabupaten | ringkasan (demo) | P2 |

Tidak ada 3D di TABAT Lapangan.

Aturan bersama: legenda angka selalu tampil ("1 lantai = 1 tahun berjejak"); tombol "Tampilan 2D"; `prefers-reduced-motion` → kamera statis tanpa terbang; WebGL mati → 2D/daftar seperti sekarang; render hanya saat ada perubahan (pola Sparekit `components/three/stage.ts`).

## 7. Pendekatan teknis

| | A. MapLibre `fill-extrusion` + SVG isometrik | B. three.js ala Sparekit | C. deck.gl |
|---|---|---|---|
| Dependensi baru | tidak ada | `three` (~600 KB, perlu izin; TRD §2 menolak) | `deck.gl` (besar, perlu izin) |
| 3D-1, 3D-2, 3D-4 | lapisan ekstrusi di peta yang sudah ada; satu sumber `blocks.geojson`; atribut lewat feature-state | membangun ulang peta di scene three.js | `PolygonLayer` extruded di atas MapLibre |
| 3D-3 | SVG 2.5D, ringan, tajam di tangkapan layar 2× | scene studio dengan cahaya/bayangan, paling mirip Sparekit | tidak cocok |
| Risiko | tinggi via feature-state perlu dicek di spike | kode banyak, fallback 2D terpisah | gaya visual beda dari sisa app |

**Pilihan saya: A.** Nol dependensi, memakai peta dan data yang sudah ada, fallback 2D gratis, tetap ringan untuk LCP. three.js (B) hanya dipertimbangkan untuk 3D-3 bila spike SVG terasa datar, dan itu butuh izin user terpisah.

Spike (dikerjakan pertama, < 1 jam): pastikan `fill-extrusion-height` membaca `feature-state` di MapLibre 5. Bila tidak, tinggi dimasukkan sebagai properti `t` (0–10) ke `blocks.geojson` (± 25 KB) dan 10 flag tahun sebagai satu bitmask `y` (± 40 KB).

## 8. Rencana kerja (setelah disetujui)

| Fase | Isi | Berkas utama | Selesai bila |
|---|---|---|---|
| R0 | spike feature-state ekstrusi | `components/map/*` (salinan uji) | keputusan atribut tercatat |
| R1 | token & tipografi §4 | `app/globals.css`, `app/layout.tsx`, `components/ui/*`, `components/shell/*`, `components/map/style.ts` | semua layar memakai palet baru; Lighthouse a11y tetap 100 |
| R2 | siluet Indonesia §5 | `pipeline/build_db.py` (langkah geo baru), `public/geo/indonesia*.{geojson,svg}`, `components/map/*`, `app/masuk/page.tsx` | inset tampil di 3 layar; `check_numbers` lulus |
| R3 | 3D-1 Menara pengulangan | `components/map/*`, `components/peta/*` | sakelar 2D/3D; peta idle < 2 s |
| R4 | 3D-2 Tumpukan tahun | `components/bukti/*` | langkah replay menyusun lapis; angka 9,3/46,2/8,9 tidak berubah |
| R5 | 3D-3 Penampang gambut | `components/blok/PeatSection.tsx` | muka air & ambang terbaca; label ilustrasi + DEMO |
| R6 | 3D-4 (opsional) | `components/hero/*` | mati bawaan; LCP hero < 2,5 s |
| R7 | QA: grep kejujuran, Playwright, a11y, audit angka, tangkapan layar ulang | `tests/*`, `docs/screens/*`, `docs/04_DESIGN_BRIEF.md` §2 diperbarui | gate G3–G6 lulus ulang |

R1 dan R2 bisa paralel; R3 dan R4 berbagi `components/map/*` sehingga berurutan; R5 paralel dengan R3/R4.

## 9. Keputusan yang saya ambil (koreksi bila tidak cocok)

1. Mode terang Grow dengan header + sidebar Weathervane, bukan mode gelap penuh.
2. Caramel tidak dipakai untuk teks; teks di atas Caramel memakai Weathervane.
3. Lencana DEMO dibedakan dengan garis putus-putus, bukan warna ungu.
4. Font judul Bricolage Grotesque 800 + JetBrains Mono untuk label teknis.
5. Teknologi 3D = MapLibre ekstrusi + SVG isometrik, tanpa three.js.
6. 3D-4 di hero opsional dan mati bawaan, demi kecepatan hero.

## 10. Di luar lingkup app (perlu keputusan terpisah)

Infografis Bab III (`Paket_Riset…/outputs/infografis_figma/`, generator `build_figma_svg.py`) masih memakai warna lama. Agar poster satu keluarga, generator itu perlu memakai palet §4.2 juga.

## 11. Catatan penerapan (14 Nov 2026)

- Tinggi menara `/peta` 3.000 m per tahun (bukan 1.500) agar terbaca di zoom jendela; tapak blok dikecilkan 62% (`components/map/pillars.ts`) agar kolom tidak menyatu.
- Tumpukan `/bukti`: jarak lapis 2.600 m, tebal 1.800 m; kamera memusat ke kantong selatan Kalteng; lapis 2024 disembunyikan (tidak dipakai uji putar ulang).
- Hero 3D: tinggi 1.000 m per blok belum siap, lewat properti GeoJSON (feature-state tidak menghasilkan ekstrusi di uji); mati bawaan, `?peta3d=1`.
- Inset Indonesia memakai `simplify(0,15)` (32 KB) agar ringan; `indonesia.geojson` 103 KB.
