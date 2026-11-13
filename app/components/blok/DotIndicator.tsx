import { TriangleAlert } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";

export type Indikator = { label: string; nilai: string; persentil: number; peringatan?: string };

function Titik({ pct }: { pct: number }) {
  const isi = Math.max(1, Math.ceil(pct / 25));
  return (
    <span className="flex gap-1" aria-hidden>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`h-3 w-3 rounded-full ${i <= isi ? "bg-tipe-3" : "border border-line-2 bg-panel-2"}`} />
      ))}
    </span>
  );
}

export function DotIndicator({ item }: { item: Indikator[] }) {
  return (
    <Card>
      <CardTitle>Dibanding blok berjejak lain</CardTitle>
      <p className="mt-1 text-[13px] text-ink-3">Bulatan terisi = kuartil persentil terhadap semua blok berjejak (4 titik = 25% teratas).</p>
      <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
        {item.map((i) => (
          <li key={i.label} className="border-b border-line py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-ink-2">{i.label}</span>
              <span className="flex items-center gap-2">
                <strong className="tabular-nums text-ink">{i.nilai}</strong>
                <Titik pct={i.persentil} />
              </span>
            </div>
            <p className="text-[12px] text-ink-3">persentil ke-{i.persentil}</p>
            {i.peringatan && (
              <p className="mt-1 flex items-start gap-1.5 text-[13px] text-segera-ink">
                <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                {i.peringatan}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
