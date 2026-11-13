"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { LABEL_KELAS, RESET_FILTER } from "@/lib/copy";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Button } from "@/components/ui/Button";
import { KELAS_PETA, LABEL_STATUS, STATUS_PETA, type FilterPeta } from "./types";

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={cn(
        "h-8 rounded-full border px-3 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ink",
        aktif ? "border-ink bg-ink text-white" : "border-line-2 bg-panel text-ink-2 hover:bg-panel-2",
      )}
    >
      {children}
    </button>
  );
}

export function Filters({ nilai, kabs, onChange, onReset }: { nilai: FilterPeta; kabs: { kab_id: string; nama: string }[]; onChange: (f: FilterPeta) => void; onReset: () => void }) {
  const [buka, setBuka] = useState(false);
  const aktif = nilai.kelas.length + nilai.status.length + (nilai.kab ? 1 : 0) + (nilai.kurang4 ? 1 : 0);

  return (
    <div className="rounded-card border border-line bg-panel">
      <button
        type="button"
        aria-expanded={buka}
        aria-controls="filter-peta"
        onClick={() => setBuka((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-[14px] font-medium text-ink lg:hidden"
      >
        <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden />
        Filter{aktif > 0 && ` (${aktif} aktif)`}
        <ChevronDown size={16} strokeWidth={1.75} aria-hidden className={cn("ml-auto transition-transform", buka && "rotate-180")} />
      </button>
      <div id="filter-peta" className={cn("flex-wrap items-end gap-x-6 gap-y-3 p-4", buka ? "flex" : "hidden lg:flex")}>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[12px] font-medium text-ink-3">Kelas</legend>
          <div className="flex flex-wrap gap-1.5">
            {KELAS_PETA.map((k) => (
              <Chip key={k} aktif={nilai.kelas.includes(k)} onClick={() => onChange({ ...nilai, kelas: toggle(nilai.kelas, k) })}>
                {LABEL_KELAS[k]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-ink-3">
          Kabupaten
          <select
            value={nilai.kab}
            onChange={(e) => onChange({ ...nilai, kab: e.target.value })}
            className="h-8 rounded-control border border-line-2 bg-panel px-2 text-[13px] text-ink focus-visible:outline-2 focus-visible:outline-ink"
          >
            <option value="">Semua</option>
            {kabs.map((k) => (
              <option key={k.kab_id} value={k.kab_id}>
                {k.nama}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
            Status <DemoBadge />
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_PETA.map((s) => (
              <Chip key={s} aktif={nilai.status.includes(s)} onClick={() => onChange({ ...nilai, status: toggle(nilai.status, s) })}>
                {LABEL_STATUS[s]}
              </Chip>
            ))}
          </div>
        </fieldset>
        <label className="flex h-8 items-center gap-2 text-[13px] text-ink-2">
          <input type="checkbox" checked={nilai.kurang4} onChange={(e) => onChange({ ...nilai, kurang4: e.target.checked })} className="h-4 w-4 accent-[var(--ink)]" />
          Kelengkapan pengamatan &lt; 4 tahun
        </label>
        {aktif > 0 && (
          <Button varian="ghost" className="h-8 px-3 text-[13px]" onClick={onReset}>
            {RESET_FILTER}
          </Button>
        )}
      </div>
    </div>
  );
}
