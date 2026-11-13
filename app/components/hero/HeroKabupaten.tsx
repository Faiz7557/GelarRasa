"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, X } from "lucide-react";
import KabupatenMap from "@/components/map/KabupatenMap";
import type { KabStat } from "@/components/map/style";
import { fmtNum, fmtPct } from "@/lib/format";
import { heroHref } from "./href";
import { DemoBadge } from "@/components/ui/DemoBadge";

/** Peta kabupaten + chip saring + daftar setara (5 kabupaten terendah). Klik kabupaten -> ?kab=. */
export function HeroKabupaten({ stats, kab, elnino }: { stats: KabStat[]; kab: string | null; elnino: boolean }) {
  const router = useRouter();
  const view3d = useSearchParams().get("peta3d") === "1";
  const href = (kabBaru: string | null, v3 = view3d) => heroHref({ elnino, kab: kabBaru, peta3d: v3 });
  const pilih = (id: string) => router.push(href(id === kab ? null : id), { scroll: false });
  const nama = stats.find((s) => s.kab_id === kab)?.nama;
  // Hanya kabupaten fokus dengan ≥ 5 blok wajib, agar kabupaten berisi 1 blok tidak menutupi yang benar-benar tertinggal.
  const terendah = stats
    .filter((s) => (s as KabStat & { fokus?: boolean }).fokus !== false && s.wajib >= 5)
    .sort((a, b) => a.pct - b.pct || b.belum - a.belum)
    .slice(0, 5);
  return (
    <div className="flex flex-col gap-3">
      {kab && (
        <p className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="rounded-full bg-panel-2 px-3 py-1 font-medium">Kabupaten: {nama ?? kab}</span>
          <Link href={href(null)} scroll={false} className="inline-flex items-center gap-1 text-ink-2 underline">
            <X size={14} aria-hidden /> hapus saring
          </Link>
        </p>
      )}
      <div className="relative h-[320px] overflow-hidden rounded-card border border-line lg:h-[440px]">
        <KabupatenMap kabStats={stats} onKabClick={pilih} height="100%" view3d={view3d} />
        <button
          type="button"
          aria-pressed={view3d}
          onClick={() => router.replace(href(kab, !view3d), { scroll: false })}
          className="absolute right-3 top-[84px] z-20 flex min-h-9 items-center gap-1.5 rounded-control border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-ink aria-pressed:bg-ink aria-pressed:text-ground"
        >
          <Box size={16} strokeWidth={1.75} aria-hidden /> 3D
        </button>
        {view3d && (
          <p className="pointer-events-none absolute bottom-[104px] left-3 z-20 flex items-center gap-2 rounded-control border border-line bg-panel/90 px-2 py-1 text-[12px] text-ink-2">
            tinggi = jumlah blok prioritas belum siap <DemoBadge />
          </p>
        )}
      </div>
      <div>
        <h3 className="mb-1 flex items-center gap-2 text-[13px] font-medium text-ink-3">Kabupaten paling belum siap <DemoBadge /></h3>
        <ul className="divide-y divide-line rounded-card border border-line bg-panel">
          {terendah.map((s) => (
            <li key={s.kab_id}>
              <button
                type="button"
                onClick={() => pilih(s.kab_id)}
                aria-pressed={s.kab_id === kab}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-[14px] hover:bg-panel-2 aria-pressed:bg-panel-2"
              >
                <span className="font-medium">{s.nama}</span>
                <span className="tabular-nums text-ink-2">
                  {fmtNum(s.belum)} belum siap · {fmtPct(s.pct)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
