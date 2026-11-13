import { Card, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fmtNum, fmtPct } from "@/lib/format";
import type { Skenario } from "@/lib/replay";

export function ReplayStats({ skenario }: { skenario: Skenario[] }) {
  const s = (id: string) => skenario.find((x) => x.skenario === id);
  const ber = s("berulang_2015_22");
  const acak = s("acak");
  if (!ber || !acak) return null;
  const kali = Math.round(ber.pct_tangkap_2023 / acak.pct_tangkap_2023);
  const kecil = [s("top5"), s("top10")].filter((x): x is Skenario => !!x);
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Seberapa tepat urutannya?</CardTitle>
        <Badge varian="netral">Data nyata: MODIS MCD64A1 × BIG</Badge>
      </div>
      <p className="font-display text-[28px] font-bold leading-[34px] text-ink">
        {fmtPct(ber.pct_blok)} blok → {fmtPct(ber.pct_tangkap_2023)} jejak 2023
      </p>
      <p className="text-[15px] leading-[22px] text-ink-2">
        {fmtNum(ber.blok)} blok berulang 2015–2022 menyentuh {fmtPct(ber.pct_tangkap_2023)} jejak 2023. Pilihan acak dengan jumlah blok setara ({fmtNum(acak.blok)} blok) hanya {fmtPct(acak.pct_tangkap_2023)}. Selisihnya{" "}
        <strong className="text-ink">≈ {kali}×</strong>.
      </p>
      <ul className="flex flex-col gap-1 border-t border-line pt-3 text-[13px] leading-[18px] text-ink-2">
        {kecil.map((k) => (
          <li key={k.skenario}>
            {fmtPct(k.pct_blok, 0)} blok teratas skor riwayat ({fmtNum(k.blok)} blok) → {fmtPct(k.pct_tangkap_2023)} jejak 2023
          </li>
        ))}
      </ul>
    </Card>
  );
}
