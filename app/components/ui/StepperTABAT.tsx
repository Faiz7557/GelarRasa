import { cn } from "@/lib/cn";
import { LANGKAH_TABAT } from "@/lib/copy";

/** `aktif` = indeks 0–4 (Telusuri … Tuntaskan). */
export function StepperTABAT({ aktif, className }: { aktif: 0 | 1 | 2 | 3 | 4; className?: string }) {
  return (
    <ol className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium", className)} aria-label="Langkah TABAT">
      {LANGKAH_TABAT.map((l, i) => (
        <li key={l} aria-current={i === aktif ? "step" : undefined} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-full px-2.5",
              i === aktif ? "bg-ink text-white" : i < aktif ? "bg-siap-soft text-siap-ink" : "bg-panel-2 text-ink-3 border border-line",
            )}
          >
            <span className="tabular-nums">{i + 1}</span>
            {l}
          </span>
          {i < LANGKAH_TABAT.length - 1 && <span aria-hidden className="h-px w-3 bg-line-2" />}
        </li>
      ))}
    </ol>
  );
}
