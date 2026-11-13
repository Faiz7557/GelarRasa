"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LABEL_KELAS } from "@/lib/copy";
import { fmtNum, fmtPct } from "@/lib/format";
import type { Kelas } from "@/lib/rules";
import { EmptyState } from "@/components/ui/EmptyState";
import { DemoBadge } from "@/components/ui/DemoBadge";
import type { KabStat } from "./style";

export const PESAN_PETA_MATI = "Peta tidak bisa dimuat di perangkat ini; berikut daftar blok.";

type Baris = { block_id: number; kab: string | null; kelas: Kelas; hotspot: number };

/** Daftar setara bila WebGL mati (docs/03 §7): kabupaten (mode kabupaten) atau 100 blok teratas. */
export function MapFallbackList({ mode, kabStats, kelas, onBlockClick, onKabClick }: { mode: "blok" | "kabupaten"; kabStats?: KabStat[]; kelas?: string[]; onBlockClick?: (id: number) => void; onKabClick?: (kab: string) => void }) {
  const [blok, setBlok] = useState<Baris[] | null>(null);
  const q = kelas?.length === 1 ? `&kelas=${kelas[0]}` : "";

  useEffect(() => {
    if (mode !== "blok") return;
    let batal = false;
    fetch(`/api/blok?limit=100${q}`)
      .then((r) => r.json())
      .then((j) => !batal && setBlok(j.data ?? []))
      .catch(() => !batal && setBlok([]));
    return () => {
      batal = true;
    };
  }, [mode, q]);

  return (
    <div role="region" aria-label="Daftar pengganti peta" className="rounded-card border border-line bg-panel p-4">
      <p className="mb-3 text-ink-2">{PESAN_PETA_MATI}</p>
      {mode === "kabupaten" && <p className="mb-2"><DemoBadge /></p>}
      {mode === "kabupaten" ? (
        <ul className="divide-y divide-line">
          {(kabStats ?? []).map((k) => (
            <li key={k.kab_id}>
              <button type="button" onClick={() => onKabClick?.(k.kab_id)} className="flex w-full items-center justify-between gap-3 py-2 text-left">
                <span className="font-medium text-ink">{k.nama}</span>
                <span className="tabular-nums text-ink-2">
                  {fmtPct(k.pct)} siap · {fmtNum(k.belum)} belum siap
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : blok === null ? (
        <p className="text-ink-3">Memuat daftar…</p>
      ) : blok.length === 0 ? (
        <EmptyState pesan="Tidak ada blok dengan filter ini." />
      ) : (
        <ul className="divide-y divide-line">
          {blok.map((b) => (
            <li key={b.block_id} className="flex items-center justify-between gap-3 py-2">
              <Link href={`/blok/${b.block_id}`} onClick={() => onBlockClick?.(b.block_id)} className="font-medium text-ink underline-offset-2 hover:underline">
                Blok {b.block_id}
              </Link>
              <span className="text-ink-2">
                {b.kab ?? "-"} · {LABEL_KELAS[b.kelas]}
                {b.hotspot ? " · hotspot" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
