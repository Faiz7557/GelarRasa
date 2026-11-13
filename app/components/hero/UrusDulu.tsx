"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AKSI, LABEL_KELAS, type Kelas } from "@/lib/copy";
import { fmtTanggal } from "@/lib/format";
import { Badge, type BadgeVarian } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/ui/DemoBadge";

export type BarisUrus = { block_id: number; kab: string; kelas: string; tenggat: string; urgensi: string; alasan: string; punya_tugas: boolean };

const URG: Record<string, { label: string; v: BadgeVarian }> = {
  terlambat: { label: "Terlambat", v: "telat" },
  minggu_ini: { label: "Minggu ini", v: "segera" },
  bulan_ini: { label: "Bulan ini", v: "netral" },
  aman: { label: "Aman", v: "siap" },
};

export function UrusDulu({ baris, bisaBuat }: { baris: BarisUrus[]; bisaBuat: boolean }) {
  const router = useRouter();
  const [sibuk, setSibuk] = useState<number | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  async function buat(id: number) {
    setSibuk(id);
    setPesan(null);
    try {
      const r = await fetch("/api/tugas", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ block_id: id }) });
      if (!r.ok) throw new Error();
      setPesan(`Usulan dibuat untuk blok ${id}.`);
      router.refresh();
    } catch {
      setPesan("Usulan belum dibuat. Coba lagi.");
    } finally {
      setSibuk(null);
    }
  }

  return (
    <div>
      <ol data-tour="urus-dulu" className="divide-y divide-line">
        {baris.map((b, i) => {
          const u = URG[b.urgensi] ?? URG.bulan_ini;
          return (
            <li key={b.block_id} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-4">
              <Link href={`/blok/${b.block_id}`} data-tour={i === 0 ? "kartu-lokasi" : undefined} className="flex min-w-0 flex-1 flex-col gap-1 rounded-control hover:bg-panel-2 md:flex-row md:items-center md:gap-4 md:px-2 md:py-1">
                <span className="md:w-24 shrink-0 font-display font-semibold">Blok {b.block_id}</span>
                <span className="md:w-44 shrink-0 text-[14px] text-ink-2">
                  {b.kab} · {LABEL_KELAS[b.kelas as Kelas] ?? b.kelas}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-[14px]">
                  <Badge varian={u.v}>{u.label}</Badge>
                  <span className="tabular-nums">{fmtTanggal(b.tenggat)}</span>
                </span>
                <span className="min-w-0 text-[14px] text-ink-3">{b.alasan}</span>
              </Link>
              {b.punya_tugas ? (
                <span className="flex items-center gap-2 text-[13px] text-ink-3">
                  Tugas sudah ada <DemoBadge />
                </span>
              ) : (
                bisaBuat && (
                  <Button varian="sekunder" onClick={() => buat(b.block_id)} disabled={sibuk === b.block_id}>
                    {AKSI.buatTugas}
                  </Button>
                )
              )}
            </li>
          );
        })}
      </ol>
      {pesan && (
        <p role="status" className="mt-2 text-[14px] text-ink-2">
          {pesan}
        </p>
      )}
    </div>
  );
}
