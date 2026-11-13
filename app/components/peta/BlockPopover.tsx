"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { LABEL_KELAS } from "@/lib/copy";
import { fmtNum } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { LABEL_STATUS, VARIAN_STATUS, type BlokPeta } from "./types";

export function BlockPopover({ blok, onClose, className }: { blok: BlokPeta; onClose: () => void; className?: string }) {
  return (
    <div
      role="dialog"
      aria-label={`Blok ${blok.block_id}`}
      className={cn("w-[min(300px,calc(100%-24px))] rounded-card border border-line bg-panel p-4 shadow-[0_8px_24px_rgb(0_0_0/.12)]", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-[16px] font-semibold leading-6 text-ink">Blok {blok.block_id}</p>
          <p className="text-[13px] text-ink-2">{blok.kab}</p>
        </div>
        <button type="button" aria-label="Tutup" onClick={onClose} className="rounded-control p-1 text-ink-2 hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-ink">
          <X size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
        <dt className="text-ink-3">Kelas</dt>
        <dd className="text-ink">{LABEL_KELAS[blok.kelas]}</dd>
        <dt className="text-ink-3">Terakhir berjejak</dt>
        <dd className="text-ink tabular-nums">{blok.last_year || "-"}</dd>
        <dt className="text-ink-3">Pengamatan lengkap</dt>
        <dd className="text-ink tabular-nums">{fmtNum(blok.full_obs_years, 1)} tahun</dd>
        <dt className="text-ink-3">Status</dt>
        <dd className="flex items-center gap-1.5">
          <Badge varian={VARIAN_STATUS[blok.status]}>{LABEL_STATUS[blok.status]}</Badge>
          <DemoBadge />
        </dd>
      </dl>
      <Link
        href={`/blok/${blok.block_id}`}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-control bg-ink px-4 text-[14px] font-medium text-white hover:bg-ink-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Buka Kartu Lokasi
      </Link>
    </div>
  );
}
