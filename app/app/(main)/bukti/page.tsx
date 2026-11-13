import { JUDUL_LAYAR } from "@/lib/copy";
import { getReplayData } from "@/lib/replay";
import { ReplayPlayer } from "@/components/bukti/ReplayPlayer";
import { ReplayStats } from "@/components/bukti/ReplayStats";
import { ReplayCurve } from "@/components/bukti/ReplayCurve";
import { Limitations } from "@/components/bukti/Limitations";
import { Concentration } from "@/components/bukti/Concentration";

export default function Bukti() {
  const d = getReplayData();
  const n = d.skenario.find((s) => s.skenario === "berulang_2015_22")?.blok ?? d.hitung.prioritas;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] font-bold leading-[34px] text-ink">{JUDUL_LAYAR.bukti}</h1>
      <p className="text-[18px] leading-7 text-ink-2">Seandainya TABAT dipakai akhir 2022…</p>
      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <ReplayPlayer blok={d.blok} hitung={d.hitung} />
        <div className="flex min-w-0 flex-col gap-4">
          <ReplayStats skenario={d.skenario} />
          <ReplayCurve kurva={d.kurva} nBerulang={n} />
        </div>
      </div>
      <Concentration />
      <Limitations />
    </div>
  );
}
