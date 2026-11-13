import { LEGENDA_KALIMAT } from "@/lib/copy";
import { cn } from "@/lib/cn";
import { C } from "./style";

const TIPE = [
  { cls: "bg-tipe-1", label: "Tipe 1 · jejak sekali di tahun kering" },
  { cls: "bg-tipe-2", label: "Tipe 2 · jejak di luar tahun El Niño" },
  { cls: "bg-tipe-3", label: "Tipe 3 · kantong berulang" },
];

/** Legenda peta: selalu tampil, dengan kalimat tetap (docs/04 §4). */
export function Legend({ className, view3d = false }: { className?: string; view3d?: boolean }) {
  return (
    <div className={cn("rounded-card border border-line bg-panel p-4 text-[13px] leading-[18px] text-ink-2", className)} aria-label="Legenda peta" role="group">
      <ul className="flex flex-col gap-2">
        {TIPE.map((t) => (
          <li key={t.label} className="flex items-center gap-2">
            <span aria-hidden className={cn("h-3 w-5 shrink-0 rounded-sm", t.cls)} />
            {t.label}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden className={cn("h-3 w-5 shrink-0 rounded-sm", view3d ? "bg-[#8f3924]" : "border-[1.5px] border-hotspot")} />
          {view3d ? "Hotspot pengulangan (menara 15% lebih gelap)" : "Hotspot pengulangan (garis tepi tua)"}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="w-5 shrink-0 border-t-[1.5px] border-dashed border-ink" />
          Jendela studi
        </li>
        <li className="flex items-center gap-2">
          {/* Sama dengan overlay peta: Weathervane 9% di atas daratan. */}
          <span aria-hidden className="h-3 w-5 shrink-0 rounded-sm" style={{ backgroundColor: C.daratan, backgroundImage: "linear-gradient(rgba(44,35,24,.09),rgba(44,35,24,.09))" }} />
          Di luar jendela studi
        </li>
      </ul>
      {view3d && (
        <div className="mt-3 flex items-end gap-3 border-t border-line pt-3">
          <div aria-hidden className="flex items-end gap-2">
            {[1, 5, 10].map((n) => (
              <div key={n} className="flex flex-col items-center gap-0.5">
                <div className="flex w-3 flex-col-reverse gap-px">
                  {Array.from({ length: n }, (_, i) => (
                    <span key={i} className="h-[3px] bg-tipe-3" />
                  ))}
                </div>
                <span className="text-[11px] tabular-nums text-ink-3">{n}</span>
              </div>
            ))}
          </div>
          <p className="font-medium text-ink">1 lantai = 1 tahun berjejak 2015–2024, bukan peluang terbakar.</p>
        </div>
      )}
      <p className="mt-3 border-t border-line pt-3 font-medium text-ink">Peta ini {LEGENDA_KALIMAT}.</p>
    </div>
  );
}
