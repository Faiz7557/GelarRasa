import { Card, CardTitle } from "@/components/ui/Card";

const EL_NINO = new Set([2015, 2019, 2023]);
type Tahun = { tahun: number; pos_cells: number; obs_full_cells: number };

export function YearStrip({ years, maskCells }: { years: Tahun[]; maskCells: number }) {
  const mask = Math.max(maskCells, 1);
  return (
    <Card>
      <CardTitle>Jejak per tahun, 2015–2024</CardTitle>
      <ol className="mt-4 grid grid-cols-10 gap-1.5 sm:gap-2">
        {years.map((y) => {
          const pos = y.pos_cells > 0;
          const rendah = y.obs_full_cells / mask < 0.5;
          const en = EL_NINO.has(y.tahun);
          const tip = `${y.tahun}: ${y.pos_cells} sel bukti positif${en ? " · tahun El Niño" : ""}${rendah ? " · pengamatan lengkap rendah" : ""}`;
          return (
            <li key={y.tahun} title={tip} aria-label={tip} className="flex flex-col items-center gap-1">
              <div
                className={`relative flex h-16 w-full items-end overflow-hidden rounded-[6px] bg-panel-2 border-b-[3px] ${en ? "border-el-nino" : "border-transparent"}`}
                style={rendah ? { backgroundImage: "repeating-linear-gradient(45deg, transparent 0 4px, var(--line-2) 4px 5px)" } : undefined}
              >
                {pos && <div className="w-full bg-tipe-3" style={{ height: `${Math.max(12, Math.min(100, (y.pos_cells / mask) * 100))}%` }} />}
              </div>
              <span aria-hidden className="text-[11px] tabular-nums text-ink-3 sm:text-[12px]">
                {String(y.tahun).slice(2)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-3">
        <span>Tinggi batang = porsi sel bukti positif</span>
        <span>
          <span aria-hidden className="mr-1 inline-block h-[3px] w-4 bg-el-nino align-middle" />
          Garis bawah = tahun El Niño (2015, 2019, 2023)
        </span>
        <span>Arsir = pengamatan lengkap rendah</span>
      </p>
    </Card>
  );
}
