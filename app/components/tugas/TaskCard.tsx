"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AKSI, LABEL_ALASAN, LABEL_KELAS, type Alasan, type Kelas } from "@/lib/copy";
import { fmtTanggal } from "@/lib/format";
import { PEOPLE, isPersonaId } from "@/lib/people";
import { canTransition, type Peran } from "@/lib/rules";
import { buildWaLink } from "@/lib/wa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { LABEL_JENIS, type TugasKartu } from "./types";

export type AksiKartu = "setujui" | "tolak" | "terbukti" | "dirawat" | "buka";

export function TaskCard({ t, peran, baseUrl, onAksi }: { t: TugasKartu; peran: Peran; baseUrl: string; onAksi: (a: AksiKartu, t: TugasKartu) => void }) {
  const pemilik = t.pemilik && isPersonaId(t.pemilik) ? PEOPLE[t.pemilik] : null;
  const can = (to: Parameters<typeof canTransition>[1]) => canTransition(t.status, to, peran, { hasPhotoVisit: t.has_foto_visit });
  const jenisLabel = LABEL_JENIS[t.jenis] ?? t.jenis;
  const wa =
    peran === "koordinator" && t.status === "disetujui" && pemilik
      ? buildWaLink(pemilik, { block_id: t.block_id, kab: t.kab, lat: t.lat, lon: t.lon, tenggat: t.tenggat, jenisLabel }, baseUrl)
      : null;

  return (
    <article className="flex flex-col gap-2 rounded-card border border-line bg-panel p-3" data-tugas={t.tugas_id}>
      <div className="flex items-start justify-between gap-2">
        <Link href={`/blok/${t.block_id}`} className="font-display text-[16px] font-semibold text-ink underline-offset-2 hover:underline">
          Blok {t.block_id}
        </Link>
        <DemoBadge />
      </div>
      <p className="text-[13px] text-ink-2">
        {t.kab ?? "-"} · {jenisLabel}
        {t.kelas && ` · ${LABEL_KELAS[t.kelas as Kelas] ?? t.kelas}`}
      </p>
      <p className="flex items-center gap-2 text-[13px] text-ink-2">
        {pemilik ? (
          <>
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-panel-2 text-[11px] font-semibold text-ink">
              {pemilik.inisial}
            </span>
            {pemilik.nama}
          </>
        ) : (
          "Belum ada pemilik"
        )}
      </p>
      <p className="flex flex-wrap items-center gap-2 text-[13px]">
        <span className={t.terlambat ? "font-medium text-telat-ink" : "text-ink-2"}>Tenggat {fmtTanggal(t.tenggat)}</span>
        {t.terlambat && <Badge varian="telat">Terlambat</Badge>}
        {t.mingguIni && <Badge varian="segera">Minggu ini</Badge>}
      </p>
      {t.status === "ditolak" && t.alasan_tolak && (
        <p className="text-[13px] text-ink-2">
          Alasan: {LABEL_ALASAN[t.alasan_tolak as Alasan] ?? t.alasan_tolak}
          {t.catatan_tolak && ` · ${t.catatan_tolak}`}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {can("disetujui") && (
          <Button varian="primer" onClick={() => onAksi("setujui", t)}>
            {AKSI.setujui}
          </Button>
        )}
        {can("ditolak") && (
          <Button varian="sekunder" onClick={() => onAksi("tolak", t)}>
            {AKSI.tolak}
          </Button>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-control bg-siap px-4 text-[14px] font-medium text-white hover:brightness-95">
            <MessageCircle size={18} strokeWidth={1.75} aria-hidden />
            {AKSI.kirimWa}
          </a>
        )}
        {t.status === "diperiksa" && can("dirawat") && (
          <Button varian="sekunder" onClick={() => onAksi("dirawat", t)}>
            Tandai dirawat
          </Button>
        )}
        {(t.status === "diperiksa" || t.status === "dirawat") && can("terbukti") && (
          <Button varian="primer" onClick={() => onAksi("terbukti", t)}>
            {AKSI.tandaiTerbukti}
          </Button>
        )}
        {t.status === "ditolak" && can("usulan") && (
          <Button varian="sekunder" onClick={() => onAksi("buka", t)}>
            Buka ulang
          </Button>
        )}
      </div>
    </article>
  );
}
