# Audit angka TABAT (T74)

Tanggal audit: 13 Nov 2026, diulang 14 Nov 2026 setelah redesign (0 selisih). Build produksi lokal, persona koordinator, setelah **Reset demo**, `as_of` = 1 Jun 2027.
Metode: Playwright (Edge) membaca `document.body.innerText` tiap layar, lalu setiap angka dicocokkan dengan query ke `app/data/tabat.db`. Gerbang pipeline `pipeline/check_numbers.py`: **180 cek lulus, 0 gagal** (134 sebelum redesign).

## Angka riset (data nyata, harus sama dengan registri Bab III)

| Layar | Teks di layar | Sumber di DB | Hasil |
|---|---|---|---|
| `/bukti` | 9,3% blok → 46,2% jejak 2023 | `replay.berulang_2015_22` (522 blok, 9,3, 46,2) | cocok |
| `/bukti` | acak 8,9% (525 blok), ≈ 5× | `replay.acak` | cocok |
| `/bukti` | 5% teratas (281 blok) → 27,9%; 10% teratas (563 blok) → 49,0% | `replay.top5`, `replay.top10` | cocok |
| `/bukti` | 8,2% blok → 77,8%; 462 blok hotspot | `facts.hotspot_pct_blok`, `hotspot_pct_luas`, `hotspot_blok` | cocok |
| `/bukti` | Moran's I 0,69; 2,81× acak; p = 0,011 | `facts.moran_I`, `rasio_acak`, `p_toroidal` | cocok |
| `/data` | 95,5% luas terbakar Agu–Okt | `facts.agu_okt_pct` | cocok |
| `/data` | pengamatan < 4 tahun: 360 dari 524 blok P1+P2 | `blocks.full_obs_years` | cocok |
| `/data` | kutipan eksternal 60,0% / 37,7% / 70,0%, berlabel "cek laporan asli" | `external_facts` | cocok |
| `/blok/50980` | Berjejak 5 dari 10 tahun, terakhir 2023, 96% selnya berulang | `block_years`, `blocks.repeated_pct` | cocok |
| `/peta` | 1.841 blok berjejak | `blocks where tipe > 0` | cocok |

## Angka demo (seed, selalu berlencana DEMO)

| Layar | Teks di layar | Sumber | Hasil |
|---|---|---|---|
| `/` | 61 hari menuju 1 Agu | `meta.as_of` → `meta.deadline` | cocok |
| `/` | 123 dari 358 blok prioritas siap · 34,4% | `/api/ringkasan` = SQL 05 §5 + `rules.readiness` | cocok |
| `/?elnino=1` | 165 dari 524 · 31,5% | idem dengan P1+P2 | cocok |
| `/` | 10 terlambat · 0 minggu ini · 14 menunggu persetujuan | `ringkasan.tugas` | cocok |

## Temuan yang diperbaiki saat audit

1. Bukti "Konsentrasi" dan "Pengelompokan" (00_BRIEF §5) belum tampil di layar mana pun → ditambah kartu "Kenapa mulai dari kantong yang sama?" di `/bukti` (`components/bukti/Concentration.tsx`), angka dari `facts`.
2. `/data` menulis satuan ganda "536,6 ha ha" → diperbaiki.

## Catatan

- Persentase jendela studi per provinsi (92,5% Kalteng, 75,1% Kalsel; PRD §7) tidak ada di registri riset maupun `tabat.db`, sehingga `/data` menulis jendela studi tanpa angka. Tambahkan ke `facts` bila sumbernya tersedia.
- Selisih: **0**.
