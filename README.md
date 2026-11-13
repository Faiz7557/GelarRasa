# TABAT

Dashboard pencegahan kebakaran gambut berulang (Gelar Rasa 2026, Bab IV).
*Ingat tempatnya, basahi gambutnya, sebelum Agustus.*

- Dokumen: [docs/00_BRIEF.md](docs/00_BRIEF.md) sampai [docs/06_IMPLEMENTATION_PLAN.md](docs/06_IMPLEMENTATION_PLAN.md)
- Progres: [docs/PROGRESS.md](docs/PROGRESS.md) · Audit angka: [docs/AUDIT_ANGKA.md](docs/AUDIT_ANGKA.md)
- Tangkapan layar poster: [docs/screens/](docs/screens/)
- URL publik: **belum dideploy** (T76 menunggu keputusan pemilik akun Vercel)

## Struktur

- `pipeline/` (Python 3.13): membangun `app/data/tabat.db` dan `app/public/geo/*.geojson` dari `../Paket_Riset_Karhutla_Berulang`, mengisi data demo fiktif, dan memeriksa angka riset.
- `app/` (Next.js 16, React 19, Tailwind 4, better-sqlite3, MapLibre, Recharts): dashboard. DB analitik dibaca read-only; data operasional (tugas, kunjungan) ditulis ke `tabat-ops.sqlite` di folder temp dan bisa dikembalikan dengan **Reset demo**.

## Menjalankan lokal

```bash
/c/Python313/python.exe pipeline/build_db.py
/c/Python313/python.exe pipeline/seed_demo.py
/c/Python313/python.exe pipeline/check_numbers.py
```

```bash
cd app && npm install && cp .env.example .env.local && npm run dev
```

Buka http://localhost:3000, klik **Masuk sebagai demo** (koordinator). Persona lain: `agus@tabat.demo` (regu), `hadi@tabat.demo` (pengelola), `dewi@tabat.demo` (kampus), kata sandi `DEMO_PASSWORD` (default `tabat2026`). Isi `SESSION_SECRET` dengan string acak ≥ 32 karakter. `ANTHROPIC_API_KEY` opsional: tanpa kunci, sortir alasan memakai kata kunci dan ringkasan pimpinan memakai templat.

## Pemeriksaan

```bash
cd app && npx tsc --noEmit && npm run lint
```

```bash
cd app && npx tsx --test lib/rules.test.ts lib/reasons.test.ts && npx tsx --conditions=react-server --test lib/ai.test.ts
```

```bash
cd app && node scripts/api-smoke.mjs
```

```bash
cd app && npx playwright test
```

`api-smoke.mjs` butuh server jalan (`BASE`, default http://localhost:3000). Playwright memakai Microsoft Edge (`channel: 'msedge'`) dan menyalakan dev server sendiri di port 3171.

Beberapa dev server bisa jalan bersamaan dengan distDir berbeda, mis. `NEXT_DIST_DIR=.next/par/a npx next dev -p 3101`.

## Batas kejujuran

Data lapangan, tugas, akses, dan kunjungan adalah **demo fiktif** dan selalu berlencana DEMO. Riwayat jejak (MODIS MCD64A1 × BIG), tipe, hotspot, GWIS, dan Putar Ulang 2023 adalah data nyata. TABAT tidak meramal kebakaran dan tidak mengukur emisi.
