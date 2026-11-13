import { Card, CardTitle } from "@/components/ui/Card";
import { getFacts } from "@/lib/data";
import { fmtNum, fmtPct } from "@/lib/format";

/** Bukti Bab III (00_BRIEF §5): konsentrasi hotspot dan pengelompokan. Semua angka dari tabel facts. */
export function Concentration() {
  const f = Object.fromEntries(getFacts().map((x) => [x.key, x.value]));
  const ada = ["hotspot_blok", "hotspot_pct_blok", "hotspot_pct_luas", "moran_I", "rasio_acak", "p_toroidal"].every((k) => typeof f[k] === "number");
  if (!ada) return null;
  return (
    <Card>
      <CardTitle>Kenapa mulai dari kantong yang sama?</CardTitle>
      <p className="mt-1 text-[13px] text-ink-3">Data nyata: MODIS MCD64A1 × BIG, 2015–2024</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="font-display text-[28px] font-bold leading-8 text-ink">
            {fmtPct(f.hotspot_pct_blok)} blok → {fmtPct(f.hotspot_pct_luas)}
          </p>
          <p className="mt-1 text-ink-2">
            {fmtNum(f.hotspot_blok)} blok hotspot pengulangan (Gi*, q &lt; 0,05) memuat {fmtPct(f.hotspot_pct_luas)} luas berulang.
          </p>
        </div>
        <div>
          <p className="font-display text-[28px] font-bold leading-8 text-ink">{fmtNum(f.rasio_acak, 2)}× acak</p>
          <p className="mt-1 text-ink-2">
            Pengulangan mengelompok: Moran&apos;s I {fmtNum(f.moran_I, 2)}, {fmtNum(f.rasio_acak, 2)} kali lebih sering daripada pola acak (uji toroidal p = {fmtNum(f.p_toroidal, 3)}).
          </p>
        </div>
      </div>
    </Card>
  );
}
