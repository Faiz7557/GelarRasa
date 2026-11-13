import { notFound } from "next/navigation";
import { AlertTriangle, CircleCheck, CircleHelp, MapPin } from "lucide-react";
import { AnswerCard } from "@/components/blok/AnswerCard";
import { BlockActions } from "@/components/blok/BlockActions";
import { BlockMiniMap } from "@/components/blok/BlockMiniMap";
import { PeatSection } from "@/components/blok/PeatSection";
import { DotIndicator, type Indikator } from "@/components/blok/DotIndicator";
import { persentil } from "@/components/blok/percentiles";
import { Timeline, peristiwa } from "@/components/blok/Timeline";
import { YearStrip } from "@/components/blok/YearStrip";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { StepperTABAT } from "@/components/ui/StepperTABAT";
import { getSession } from "@/lib/auth";
import { LABEL_KELAS, type Kelas } from "@/lib/copy";
import { getBlok } from "@/lib/data";
import { fmtNum, fmtPct, fmtTanggal } from "@/lib/format";
import { AMBANG_AIR_CM } from "@/lib/rules";

export const dynamic = "force-dynamic";

const LABEL_TIPE: Record<number, string> = { 1: "Jejak sekali di tahun kering", 2: "Jejak di luar tahun El Niño", 3: "Kantong berulang" };

export default async function Blok({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  if (!/^\d{1,9}$/.test(raw)) notFound();
  const d = getBlok(Number(raw));
  if (!d) notFound();

  const b = d.block as Record<string, number | string>;
  const num = (k: string) => Number(b[k] ?? 0);
  const id = num("block_id");
  const tipe = num("tipe");
  const sesi = await getSession();
  const bisaBuat = sesi?.id === "koordinator" || sesi?.id === "kampus";

  const fullObs = num("full_obs_years");
  const indikator: Indikator[] = [
    { label: "Bagian berjejak", nilai: fmtPct(num("ever_pct")), persentil: persentil("ever_pct", num("ever_pct")) },
    { label: "Bagian berulang", nilai: fmtPct(num("repeated_pct")), persentil: persentil("repeated_pct", num("repeated_pct")) },
    { label: "Tahun positif terbanyak", nilai: `${num("max_years")} tahun`, persentil: persentil("max_years", num("max_years")) },
    { label: "Jejak El Niño", nilai: fmtPct(num("elnino_pct")), persentil: persentil("elnino_pct", num("elnino_pct")) },
    { label: "Jejak terakhir", nilai: num("last_year") ? String(num("last_year")) : "-", persentil: persentil("last_year", num("last_year")) },
    {
      label: "Kelengkapan pengamatan",
      nilai: `${fmtNum(fullObs, Number.isInteger(fullObs) ? 0 : 1)} dari 10 tahun`,
      persentil: persentil("full_obs_years", fullObs),
      peringatan: fullObs < 4 ? "Pengamatan bolong, jangan turunkan prioritas." : undefined,
    },
  ];

  const kunj = d.kunjungan;
  const terakhir = kunj[0];
  const air = d.status_air;
  const tugas = d.tugas;
  const lat = num("lat");
  const lon = num("lon");
  const kab = (d.kab as { nama?: string } | null)?.nama ?? "-";
  const tabat = d.tabat as { tabat_id: string; bahan: string; kondisi_awal: string }[];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-[24px] font-bold leading-[30px] text-ink sm:text-[28px] sm:leading-[34px]">
          Blok {id} · {kab} · {LABEL_KELAS[b.kelas as Kelas] ?? String(b.kelas)}
        </h1>
        <div className="flex flex-wrap gap-2">
          {tipe > 0 && <Badge varian="netral">{LABEL_TIPE[tipe]}</Badge>}
          {num("hotspot") === 1 && <Badge varian="telat">Hotspot pengulangan</Badge>}
        </div>
        <StepperTABAT aktif={1} />
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="lg:col-start-1">
          <AnswerCard jawaban={d.jawaban} urgensi={d.urgensi} />
        </div>
        <div className="lg:col-start-1">
          <PeatSection
            mukaAirCm={terakhir?.muka_air_cm ?? null}
            kondisiTabat={terakhir?.kondisi_tabat ?? null}
            tabatId={terakhir?.tabat_id ?? null}
            tanggal={terakhir?.tanggal ?? null}
          />
        </div>

        <div className="flex flex-col gap-5 lg:col-start-2 lg:row-start-1 lg:row-span-5">
          <Card padded={false} className="overflow-hidden">
            <BlockMiniMap id={id} lon={num("lon")} lat={num("lat")} />
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <CardTitle>Tabat di blok ini</CardTitle>
              <DemoBadge />
            </div>
            {tabat.length === 0 ? (
              <p className="mt-2 text-ink-2">Belum ada tabat tercatat.</p>
            ) : (
              <ul className="mt-2 flex flex-col divide-y divide-line">
                {tabat.map((t) => (
                  <li key={t.tabat_id} className="flex items-center justify-between gap-3 py-2">
                    <span className="font-medium text-ink">{t.tabat_id}</span>
                    <span className="text-ink-2">
                      {t.bahan.replaceAll("_", " ")} · {t.kondisi_awal.replaceAll("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <div className="flex items-center gap-2">
              <CardTitle>Kunjungan terakhir</CardTitle>
              <DemoBadge />
            </div>
            {!terakhir ? (
              <p className="mt-2 text-ink-2">Belum diperiksa tahun ini.</p>
            ) : (
              <div className="mt-2 flex flex-col gap-1.5">
                <p className="text-ink-2">{fmtTanggal(terakhir.tanggal)}</p>
                <p className="flex flex-wrap items-center gap-2 text-ink">
                  {terakhir.muka_air_cm == null ? "Muka air belum diukur" : `Muka air ${fmtNum(terakhir.muka_air_cm)} cm (ambang ${AMBANG_AIR_CM} cm)`}
                  {air === "aman" && (
                    <Badge varian="siap" className="gap-1">
                      <CircleCheck aria-hidden className="h-3.5 w-3.5" /> Aman
                    </Badge>
                  )}
                  {air === "kering" && (
                    <Badge varian="telat" className="gap-1">
                      <AlertTriangle aria-hidden className="h-3.5 w-3.5" /> Kering, di bawah ambang
                    </Badge>
                  )}
                  {air === "belum" && (
                    <Badge varian="netral" className="gap-1">
                      <CircleHelp aria-hidden className="h-3.5 w-3.5" /> Belum diukur
                    </Badge>
                  )}
                </p>
              </div>
            )}
          </Card>
          <Card>
            <CardTitle className="flex items-center gap-2">
              <MapPin aria-hidden className="h-5 w-5 text-ink-3" />
              Aksi
            </CardTitle>
            <p className="mt-1 text-[13px] text-ink-3 tabular-nums">
              {lat.toFixed(5)}, {lon.toFixed(5)}
            </p>
            <div className="mt-3">
              <BlockActions id={id} lat={lat} lon={lon} bisaBuat={bisaBuat} />
            </div>
          </Card>
        </div>

        <div className="lg:col-start-1">
          <YearStrip years={d.years} maskCells={num("mask_cells")} />
        </div>
        <div className="lg:col-start-1">
          <DotIndicator item={indikator} />
        </div>
        <div className="lg:col-start-1">
          <Timeline
            item={peristiwa(
              kunj,
              tugas as unknown as Parameters<typeof peristiwa>[1],
              d.aktivitas as Parameters<typeof peristiwa>[2],
            )}
          />
        </div>
      </div>
    </div>
  );
}
