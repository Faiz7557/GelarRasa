"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { LABEL_KELAS } from "@/lib/copy";
import { Badge } from "@/components/ui/Badge";
import { LABEL_STATUS, VARIAN_STATUS, type BlokPeta } from "./types";

const ROW = 56;
const OVERSCAN = 6;

/** Daftar virtualized sederhana: tinggi baris tetap, hanya baris terlihat yang dirender. */
export function BlockList({ rows, selectedId, onSelect, className }: { rows: BlokPeta[]; selectedId: number | null; onSelect: (id: number) => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  const [h, setH] = useState(360);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Sorot dari peta: gulir daftar ke baris terpilih bila di luar pandangan.
  useEffect(() => {
    const el = ref.current;
    if (!el || selectedId == null) return;
    const i = rows.findIndex((r) => r.block_id === selectedId);
    if (i < 0) return;
    if (i * ROW < el.scrollTop || (i + 1) * ROW > el.scrollTop + el.clientHeight) el.scrollTop = Math.max(0, i * ROW - el.clientHeight / 2 + ROW / 2);
  }, [selectedId, rows]);

  // Filter berubah -> kembali ke atas.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [rows]);

  const awal = Math.max(0, Math.floor(top / ROW) - OVERSCAN);
  const akhir = Math.min(rows.length, Math.ceil((top + h) / ROW) + OVERSCAN);

  return (
    <div ref={ref} onScroll={(e) => setTop(e.currentTarget.scrollTop)} className={cn("overflow-y-auto", className)} role="list" aria-label="Daftar blok">
      <div style={{ height: rows.length * ROW, position: "relative" }}>
        {rows.slice(awal, akhir).map((r, j) => {
          const aktif = r.block_id === selectedId;
          return (
            <button
              key={r.block_id}
              type="button"
              role="listitem"
              aria-current={aktif ? "true" : undefined}
              onClick={() => onSelect(r.block_id)}
              style={{ position: "absolute", top: (awal + j) * ROW, height: ROW, left: 0, right: 0 }}
              className={cn(
                "flex flex-col justify-center gap-0.5 border-b border-line px-4 text-left hover:bg-panel-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
                aktif && "bg-panel-2 shadow-[inset_3px_0_0_var(--ink)]",
              )}
            >
              <span className="truncate text-[14px] font-medium text-ink">
                Blok {r.block_id} · {r.kab}
              </span>
              <span className="flex items-center gap-2 text-[13px] text-ink-2">
                {LABEL_KELAS[r.kelas]}
                <Badge varian={VARIAN_STATUS[r.status]} className="px-2 py-0 text-[12px]">
                  {LABEL_STATUS[r.status]}
                </Badge>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
