import { CalendarCheck, ClipboardList, Footprints } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LABEL_STATUS_TUGAS, type StatusTugas } from "@/lib/copy";
import { fmtTanggal } from "@/lib/format";

export type Peristiwa = { waktu: string; jenis: "kunjungan" | "tugas" | "aktivitas"; teks: string };
const IKON = { kunjungan: Footprints, tugas: ClipboardList, aktivitas: CalendarCheck };
const LABEL = { kunjungan: "Kunjungan", tugas: "Tugas", aktivitas: "Aktivitas" };

export function peristiwa(
  kunjungan: { tanggal: string; jenis: string; muka_air_cm: number | null; kondisi_tabat: string | null }[],
  tugas: { jenis: string; status: string; tenggat: string; created_at?: string }[],
  aktivitas: { waktu: string; ringkas: string }[],
): Peristiwa[] {
  return [
    ...kunjungan.map((k) => ({
      waktu: k.tanggal,
      jenis: "kunjungan" as const,
      teks: `${k.jenis === "rawat" ? "Rawat" : "Periksa"} · ${k.muka_air_cm == null ? "muka air belum diukur" : `muka air ${k.muka_air_cm} cm`}${k.kondisi_tabat ? ` · tabat ${k.kondisi_tabat.replaceAll("_", " ")}` : ""}`,
    })),
    ...tugas.map((t) => ({
      waktu: t.created_at ?? t.tenggat,
      jenis: "tugas" as const,
      teks: `Tugas ${t.jenis.replaceAll("_", " ")} · ${LABEL_STATUS_TUGAS[t.status as StatusTugas] ?? t.status} · tenggat ${fmtTanggal(t.tenggat)}`,
    })),
    ...aktivitas.map((a) => ({ waktu: a.waktu, jenis: "aktivitas" as const, teks: a.ringkas })),
  ].sort((a, b) => (a.waktu < b.waktu ? 1 : a.waktu > b.waktu ? -1 : 0));
}

export function Timeline({ item }: { item: Peristiwa[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <CardTitle>Linimasa</CardTitle>
        <DemoBadge />
      </div>
      {item.length === 0 ? (
        <EmptyState className="mt-3" pesan="Belum ada kunjungan atau tugas untuk blok ini." />
      ) : (
        <ol className="mt-3 flex flex-col">
          {item.map((p, n) => {
            const Ikon = IKON[p.jenis];
            return (
              <li key={n} className="flex gap-3 border-t border-line py-2.5 first:border-t-0">
                <Ikon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                <div className="min-w-0">
                  <p className="text-[13px] text-ink-3">
                    {fmtTanggal(p.waktu)} · {LABEL[p.jenis]}
                  </p>
                  <p className="text-ink">{p.teks}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
