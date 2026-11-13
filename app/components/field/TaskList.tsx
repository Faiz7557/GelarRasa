import { Droplets, Construction, Route } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PESAN_KOSONG } from "@/lib/copy";
import { fmtNum, fmtTanggal, hariMenuju } from "@/lib/format";
import { jarakKm } from "./helpers";
import { LABEL_JENIS_TUGAS, type TugasLap } from "./types";

const IKON: Record<string, typeof Route> = { periksa: Route, rawat_tabat: Construction, basahi: Droplets };

export function TaskList({ items, asOf, pos, menunggu, onPilih }: { items: TugasLap[]; asOf: string; pos: [number, number] | null; menunggu: Set<number>; onPilih: (t: TugasLap) => void }) {
  if (!items.length) return <EmptyState pesan={PESAN_KOSONG.lapangan} />;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((t) => {
        const Ikon = IKON[t.jenis] ?? Route;
        const hari = asOf ? hariMenuju(asOf, t.tenggat) : 99;
        const km = pos && t.lon != null && t.lat != null ? jarakKm(pos, [t.lon, t.lat]) : null;
        return (
          <li key={t.tugas_id}>
            <button type="button" onClick={() => onPilih(t)} className="flex min-h-[72px] w-full flex-col gap-2 rounded-card border border-line bg-panel p-4 text-left active:bg-panel-2">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-display text-[18px] font-semibold">
                  <Ikon size={20} strokeWidth={1.75} aria-hidden /> Blok {t.block_id}
                </span>
                <DemoBadge />
              </span>
              <span className="text-[14px] text-ink-2">
                {t.kab ?? "-"} · {t.status === "diperiksa" ? "Rawat" : (LABEL_JENIS_TUGAS[t.jenis] ?? t.jenis)}
                {km != null && ` · ${fmtNum(km, 1)} km`}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                Tenggat {fmtTanggal(t.tenggat)}
                {t.terlambat ? <Badge varian="telat">Terlambat</Badge> : hari <= 7 && <Badge varian="segera">Minggu ini</Badge>}
                {menunggu.has(t.block_id) && <Badge varian="netral">Menunggu kirim</Badge>}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
