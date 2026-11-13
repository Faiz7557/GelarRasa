"use client";

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fmtNum } from "@/lib/format";
import { PESAN_KOSONG, RESET_FILTER } from "@/lib/copy";
import { Box, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import type { BlockLite } from "@/lib/rules";
import type { TitikKurva } from "@/components/charts/CoverageChart";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import BlockMap from "@/components/map/BlockMap";
import { Legend } from "@/components/map/Legend";
import { BlockList } from "./BlockList";
import { BlockPopover } from "./BlockPopover";
import { Filters } from "./Filters";
import { SimulationDrawer, useRencana } from "./SimulationDrawer";
import type { BlokPeta, FilterPeta } from "./types";

const KOSONG: FilterPeta = { kelas: [], kab: "", kurang4: false, status: [] };

function keQuery(f: FilterPeta, sim: boolean, d3: boolean) {
  const q = new URLSearchParams();
  if (d3) q.set("tampil", "3d");
  if (sim) q.set("sim", "1");
  if (f.kelas.length) q.set("kelas", f.kelas.join(","));
  if (f.kab) q.set("kab", f.kab);
  if (f.kurang4) q.set("kurang4", "1");
  if (f.status.length) q.set("status", f.status.join(","));
  const s = q.toString();
  return s ? `?${s}` : window.location.pathname;
}

export function PetaView({
  blok,
  kabs,
  awal,
  rencanaBlok,
  kurva,
  koordinator,
  simAwal,
}: {
  blok: BlokPeta[];
  kabs: { kab_id: string; nama: string }[];
  awal: FilterPeta;
  rencanaBlok: BlockLite[];
  kurva: TitikKurva[];
  koordinator: boolean;
  simAwal: boolean;
}) {
  const [f, setF] = useState<FilterPeta>(awal);
  const [sel, setSel] = useState<number | null>(null);
  const [sim, setSim] = useState(simAwal);
  const [d3, setD3] = useState(useSearchParams().get("tampil") === "3d");
  const [elNino, setElNino] = useState(false);
  const [n, setN] = useState(200);
  const rencana = useRencana(rencanaBlok, kurva, n, elNino);

  const ubah = useCallback(
    (nf: FilterPeta) => {
      setF(nf);
      window.history.replaceState(null, "", keQuery(nf, sim, d3)); // sinkron ke URL tanpa navigasi
    },
    [sim, d3],
  );
  const bukaSim = () => {
    setSim(!sim);
    window.history.replaceState(null, "", keQuery(f, !sim, d3));
  };
  const ubah3d = () => {
    setD3(!d3);
    window.history.replaceState(null, "", keQuery(f, sim, !d3));
  };
  const blokById = useMemo(() => new Map(blok.map((b) => [b.block_id, b])), [blok]);

  const hasil = useMemo(() => {
    // Laci terbuka: peta dan daftar menampilkan hasil rencana (terurut); filter diabaikan sementara.
    if (sim) return rencana.blocks.map((b) => blokById.get(b.block_id)).filter((b): b is BlokPeta => !!b);
    const kabNama = kabs.find((k) => k.kab_id === f.kab)?.nama;
    return blok.filter(
      (b) =>
        (!f.kelas.length || f.kelas.includes(b.kelas)) &&
        (!kabNama || b.kab === kabNama) &&
        (!f.status.length || f.status.includes(b.status)) &&
        (!f.kurang4 || b.full_obs_years < 4),
    );
  }, [blok, kabs, f, sim, rencana, blokById]);

  const ids = useMemo(() => new Set(hasil.map((b) => b.block_id)), [hasil]);
  const filter = useMemo(() => ({ ids }), [ids]);
  const terpilih = useMemo(() => blok.find((b) => b.block_id === sel) ?? null, [blok, sel]);
  const reset = () => ubah(KOSONG);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          {sim ? (
            <p className="rounded-card border border-line bg-panel px-4 py-3 text-[13px] text-ink-2">Peta dan daftar menampilkan blok hasil simulasi, terurut prioritas. Tutup Simulasi untuk memakai filter lagi.</p>
          ) : (
            <Filters nilai={f} kabs={kabs} onChange={ubah} onReset={reset} />
          )}
        </div>
        <Button varian="sekunder" aria-pressed={d3} onClick={ubah3d}>
          {d3 ? <MapIcon size={16} strokeWidth={1.75} aria-hidden /> : <Box size={16} strokeWidth={1.75} aria-hidden />}
          {d3 ? "Tampilan 2D" : "Tampilan 3D"}
        </Button>
        <Button varian={sim ? "primer" : "sekunder"} aria-expanded={sim} aria-controls="simulasi" onClick={bukaSim}>
          <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden /> Simulasi
        </Button>
      </div>
      {sim && <SimulationDrawer blok={rencanaBlok} kurva={kurva} elNino={elNino} onElNino={setElNino} n={n} onN={setN} rencana={rencana} koordinator={koordinator} />}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="relative [--peta-h:360px] lg:[--peta-h:640px]">
          <BlockMap filter={filter} highlightId={sel} onBlockClick={setSel} view3d={d3} height="var(--peta-h)" />
          {terpilih && <BlockPopover blok={terpilih} onClose={() => setSel(null)} className="absolute bottom-8 left-3 z-20" />}
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label="Daftar blok">
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <p className="text-[14px] font-medium text-ink" aria-live="polite">
                <span className="tabular-nums">{fmtNum(hasil.length)}</span> blok
              </p>
              <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
                status <DemoBadge />
              </span>
            </div>
            {hasil.length === 0 ? (
              <EmptyState className="m-4" pesan={PESAN_KOSONG.peta} aksi={<Button onClick={reset}>{RESET_FILTER}</Button>} />
            ) : (
              <BlockList rows={hasil} selectedId={sel} onSelect={setSel} className="h-[320px] lg:h-[300px]" />
            )}
          </section>
          <Legend view3d={d3} />
        </div>
      </div>
    </div>
  );
}
