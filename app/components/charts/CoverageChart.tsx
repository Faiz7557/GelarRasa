"use client";

import { CartesianGrid, Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtNum, fmtPct } from "@/lib/format";

export type TitikKurva = { n_blok: number; pct_blok: number; pct_luas_berulang: number };

const TICK = { fontSize: 12, fill: "var(--ink-3)" };

/** Kurva cakupan: % luas berulang 2015–2024 menurut N blok (garis TABAT) dan baseline acak. docs/04 §5. */
export default function CoverageChart({ kurva, n, y, xMaks = 600 }: { kurva: TitikKurva[]; n: number; y: number; xMaks?: number }) {
  const data = [{ n_blok: 0, pct_blok: 0, pct_luas_berulang: 0 }, ...kurva.filter((k) => k.n_blok <= xMaks + 25)];
  return (
    <div role="img" aria-label={`Kurva cakupan: ${fmtNum(n)} kunjungan menyentuh ${fmtPct(y)} luas berulang 2015–2024`} className="h-[200px] w-full sm:h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="n_blok" type="number" domain={[0, xMaks]} ticks={[0, 100, 200, 300, 400, 500, 600]} tick={TICK} tickLine={false} axisLine={{ stroke: "var(--line-2)" }} tickFormatter={(v) => fmtNum(v)} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} width={44} tick={TICK} tickLine={false} axisLine={{ stroke: "var(--line-2)" }} tickFormatter={(v) => `${fmtNum(v)}%`} />
          <Tooltip
            cursor={{ stroke: "var(--line-2)" }}
            contentStyle={{ borderRadius: 10, border: "1px solid var(--line-2)", fontSize: 12 }}
            labelFormatter={(v) => `${fmtNum(Number(v))} blok`}
            formatter={(v, name) => [fmtPct(Number(v)), name === "pct_luas_berulang" ? "TABAT (urut prioritas)" : "Acak"]}
          />
          <Line type="monotone" dataKey="pct_blok" name="pct_blok" stroke="var(--ink-3)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="pct_luas_berulang" name="pct_luas_berulang" stroke="var(--tipe-3)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <ReferenceDot x={n} y={y} r={6} fill="var(--tipe-3)" stroke="var(--panel)" strokeWidth={2} ifOverflow="visible" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
