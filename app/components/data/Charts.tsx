"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fmtPct } from "@/lib/format";
import type { BinObs } from "@/lib/cekdata";

const AX = { fontSize: 12, fill: "var(--ink-2)" } as const;

export function ObsHistogram({ bins }: { bins: BinObs[] }) {
  const [semua, setSemua] = useState(false);
  const key = semua ? "semua" : "berjejak";
  return (
    <div>
      <div role="group" aria-label="Pilih kelompok blok" className="mb-3 flex gap-2 text-[14px]">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={semua === v}
            onClick={() => setSemua(v)}
            className={`min-h-9 rounded-control border px-3 ${semua === v ? "border-ink bg-ink text-ground" : "border-line bg-panel text-ink-2"}`}
          >
            {v ? "Semua blok" : "Blok berjejak"}
          </button>
        ))}
      </div>
      <div className="h-56 w-full" role="img" aria-label="Histogram jumlah blok menurut tahun teramati lengkap">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} margin={{ top: 4, right: 8, bottom: 16, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis dataKey="tahun" tick={AX} label={{ value: "tahun teramati lengkap", position: "insideBottom", offset: -10, ...AX }} />
            <YAxis tick={AX} width={44} />
            <Tooltip formatter={(v) => [Number(v).toLocaleString("id-ID"), "blok"]} labelFormatter={(l) => `${l} sampai kurang dari ${Number(l) + 1} tahun`} />
            <Bar dataKey={key} fill="var(--tipe-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function SeasonChart({ data }: { data: { bulan: number; pct: number }[] }) {
  const d = data.map((r) => ({ ...r, nama: BULAN[r.bulan - 1] }));
  return (
    <div className="h-56 w-full" role="img" aria-label="Porsi luas bukti positif per bulan; Agustus sampai Oktober disorot">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={d} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="nama" tick={AX} interval={0} />
          <YAxis tick={AX} width={44} unit="%" />
          <Tooltip formatter={(v) => [fmtPct(Number(v)), "porsi luas"]} />
          <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
            {d.map((r) => (
              <Cell key={r.bulan} fill={r.bulan >= 8 && r.bulan <= 10 ? "var(--tipe-3)" : "var(--line-2)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
