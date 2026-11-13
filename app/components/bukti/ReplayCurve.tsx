"use client";

import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { fmtNum, fmtPct } from "@/lib/format";
import type { TitikKurva } from "@/lib/replay";

export function ReplayCurve({ kurva, nBerulang }: { kurva: TitikKurva[]; nBerulang: number }) {
  const data = [{ n_blok: 0, pct_tangkap: 0, pct_acak: 0 }, ...kurva];
  const dekat = kurva.reduce((a, b) => (Math.abs(b.n_blok - nBerulang) < Math.abs(a.n_blok - nBerulang) ? b : a));
  const ada = Math.abs(dekat.n_blok - nBerulang) <= 25;
  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Berapa jejak 2023 tertangkap?</CardTitle>
      <p className="text-[13px] leading-[18px] text-ink-2">N blok teratas menurut skor riwayat 2015–2022, dan persen jejak 2023 yang jatuh di dalamnya.</p>
      <div className="h-[260px] w-full" role="img" aria-label={`Kurva cakupan: ${fmtNum(dekat.n_blok)} blok teratas menangkap ${fmtPct(dekat.pct_tangkap)} jejak 2023, acak ${fmtPct(dekat.pct_acak)}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="n_blok" type="number" domain={[0, "dataMax"]} tickFormatter={(v: number) => fmtNum(v)} tick={{ fontSize: 12, fill: "#52606d" }} />
            <YAxis tickFormatter={(v: number) => fmtPct(v, 0)} width={44} domain={[0, 100]} tick={{ fontSize: 12, fill: "#52606d" }} />
            <Tooltip formatter={(v, nama) => [fmtPct(Number(v)), String(nama)]} labelFormatter={(l) => `${fmtNum(Number(l))} blok teratas`} contentStyle={{ borderRadius: 10, fontSize: 13 }} />
            <Line name="Skor riwayat" dataKey="pct_tangkap" stroke="#a8432a" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line name="Acak" dataKey="pct_acak" stroke="#6b5a48" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
            {ada && <ReferenceDot x={dekat.n_blok} y={dekat.pct_tangkap} r={5} fill="#a8432a" stroke="#faf5ec" />}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[13px] leading-[18px] text-ink-2">
        <span aria-hidden className="mr-1.5 inline-block h-0.5 w-5 bg-tipe-3 align-middle" />Skor riwayat
        <span aria-hidden className="ml-4 mr-1.5 inline-block w-5 border-t-2 border-dashed border-ink-3 align-middle" />Acak
        {ada && <> · Titik: kurva pada {fmtNum(dekat.n_blok)} blok, titik terdekat dengan {fmtNum(nBerulang)} blok berulang ({fmtPct(dekat.pct_tangkap)}).</>}
      </p>
    </Card>
  );
}
