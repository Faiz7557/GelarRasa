import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getMeta, getReplay, getRingkasan } from "@/lib/data";
import { PESAN_KOSONG } from "@/lib/copy";
import { fmtNum, fmtPct, fmtTanggal } from "@/lib/format";
import { Card, CardTitle } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReadinessRing } from "@/components/hero/ReadinessRing";
import { HeroCountdown } from "@/components/hero/HeroCountdown";
import { ElNinoToggle } from "@/components/hero/ElNinoToggle";
import { HeroKabupaten } from "@/components/hero/HeroKabupaten";
import { UrusDulu } from "@/components/hero/UrusDulu";
import { AiSummary } from "@/components/hero/AiSummary";

export const dynamic = "force-dynamic";

export default async function Kesiapan({ searchParams }: { searchParams: Promise<{ elnino?: string; kab?: string; peta3d?: string }> }) {
  const sp = await searchParams;
  const elNino = sp.elnino === "1";
  const persona = await getSession();
  const semua = getRingkasan({ elNino });
  const kab = semua.per_kabupaten.some((k) => k.kab_id === sp.kab) ? sp.kab! : null;
  const r = kab ? getRingkasan({ elNino, kab }) : semua;
  const { kesiapan: k, rincian_kesiapan: rc, tugas } = r;
  const m = getMeta();
  const replay = getReplay().skenario as { skenario: string; pct_tangkap_2023: number }[];
  const pctReplay = (s: string) => {
    const v = replay.find((x) => x.skenario === s)?.pct_tangkap_2023;
    return v == null ? "-" : fmtPct(v);
  };
  const kosong = rc.diperiksa === 0 && k.siap === 0;

  const syarat = [
    ["Diperiksa", rc.diperiksa],
    ["Air diukur", rc.air_diukur],
    ["Tabat tercatat", rc.tabat_tercatat],
    ["Terbukti", rc.terbukti],
  ] as const;
  const ringkas = [
    ["Terlambat", tugas.terlambat, "/tugas?urgensi=terlambat"],
    ["Minggu ini", tugas.minggu_ini, "/tugas?urgensi=minggu_ini"],
    ["Menunggu persetujuan", tugas.menunggu_persetujuan, "/tugas?status=usulan"],
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            <h1 className="font-display text-[28px] font-semibold leading-9">Siap sebelum 1 Agustus?</h1>
            <HeroCountdown hari={r.hari_menuju_tenggat} />
            <p className="text-[14px] text-ink-3">
              Acuan data {fmtTanggal(m.as_of)} · tenggat {fmtTanggal(m.deadline)}
            </p>
            <div>
              <ElNinoToggle aktif={elNino} kab={kab} peta3d={sp.peta3d === "1"} />
            </div>
          </header>

          <Card>
            <Link href="/tugas" className="flex flex-col gap-4 rounded-control">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Kesiapan blok prioritas</CardTitle>
                <DemoBadge />
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <ReadinessRing pct={k.pct} />
                <div>
                  <p className="text-[18px] font-medium tabular-nums">
                    {fmtNum(k.siap)} dari {fmtNum(k.wajib)} blok prioritas siap
                  </p>
                  <p className="text-[14px] text-ink-3">{elNino ? "Prioritas 1 + 2 (El Niño)" : "Prioritas 1"}</p>
                </div>
              </div>
              {kosong ? (
                <EmptyState pesan={PESAN_KOSONG.kesiapan} />
              ) : (
                <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {syarat.map(([l, v]) => (
                    <div key={l} className="rounded-control bg-panel-2 p-3">
                      <dt className="text-[13px] text-ink-3">{l}</dt>
                      <dd className="font-display text-[22px] font-semibold tabular-nums">
                        {fmtNum(v)}
                        <span className="text-[13px] font-normal text-ink-3"> / {fmtNum(k.wajib)}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </Link>
          </Card>

          {persona?.id === "koordinator" && <AiSummary elNino={elNino} />}

          <Card>
            <div className="mb-3 flex items-center justify-between gap-2">
              <CardTitle>Ringkasan tugas</CardTitle>
              <DemoBadge />
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {ringkas.map(([l, n, href]) => (
                <li key={l}>
                  <Link href={href} className="flex h-full flex-col rounded-control bg-panel-2 p-3 hover:bg-line">
                    <span className="font-display text-[28px] font-semibold tabular-nums">{fmtNum(n)}</span>
                    <span className="text-[13px] text-ink-2">{l}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <HeroKabupaten stats={semua.per_kabupaten} kab={kab} elnino={elNino} />
      </div>

      <Card>
        <div className="mb-2 flex items-center justify-between gap-2">
          <CardTitle>Urus ini dulu</CardTitle>
          <DemoBadge />
        </div>
        {r.urus_dulu.length === 0 ? (
          <EmptyState pesan="Tidak ada blok yang perlu diurus untuk saringan ini." />
        ) : (
          <UrusDulu baris={r.urus_dulu} bisaBuat={persona?.id === "koordinator" || persona?.id === "kampus"} />
        )}
      </Card>

      <p>
        <Link href="/bukti" className="inline-flex min-h-11 flex-wrap items-center gap-2 font-medium text-ink underline">
          Kenapa blok ini didahulukan?
          <span className="font-normal text-ink-2">
            Putar Ulang 2023: {pctReplay("berulang_2015_22")} vs {pctReplay("acak")} bila acak
          </span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </p>
    </div>
  );
}
