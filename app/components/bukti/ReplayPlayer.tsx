"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Layers, Map as MapIcon, Pause, Play } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { fmtNum, fmtPct } from "@/lib/format";
import { WARNA } from "./colors";
import { ABU_LAPIS, CARAMEL, CLAY } from "./stack";

const ReplayMap = dynamic(() => import("./ReplayMap"), { ssr: false, loading: () => <Skeleton className="absolute inset-0" /> });

export type Hitung = { berjejak: number; prioritas: number; jejak2023: number; jejak2023Prioritas: number; sel2023: number; sel2023Prioritas: number };
const DETIK_PER_LANGKAH = 1.2;

export function ReplayPlayer({ blok, hitung: h }: { blok: [number, number][]; hitung: Hitung }) {
  const [langkah, setLangkah] = useState<1 | 2 | 3>(1);
  const [main, setMain] = useState(false);
  const [kurangGerak, setKurangGerak] = useState(false);
  const [view3d, setView3d] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setKurangGerak(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const berhenti = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setMain(false);
  }, []);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const putar = () => {
    if (main) return berhenti();
    let l = 1;
    setLangkah(1);
    setMain(true);
    timer.current = setInterval(() => {
      l += 1;
      setLangkah(l as 2 | 3);
      if (l >= 3) berhenti();
    }, DETIK_PER_LANGKAH * 1000);
  };

  const pilih = (l: 1 | 2 | 3) => {
    berhenti();
    setLangkah(l);
  };

  const [cAbu, cOranye, cMerah] = view3d ? [ABU_LAPIS, CARAMEL, CLAY] : [WARNA.abu, WARNA.oranye, WARNA.merah];
  const legenda = [
    { w: cAbu, teks: `Abu: ${fmtNum(h.berjejak)} blok berjejak bukti positif MODIS pada 2015–2022` },
    ...(langkah >= 2 ? [{ w: cOranye, teks: `Oranye: ${fmtNum(h.prioritas)} blok berulang 2015–2022 (minimal 1 sel berulang) = daftar prioritas akhir 2022` }] : []),
    ...(langkah === 3 ? [{ w: cMerah, teks: `Merah: ${fmtNum(h.jejak2023)} blok dengan jejak 2023${view3d ? "; lapis 2023 jatuh di atas lapis 2022" : "; tepi oranye = kena blok prioritas"}` }] : []),
  ];
  const caption = [
    `Langkah 1. Semua blok yang pernah berjejak 2015–2022: ${fmtNum(h.berjejak)} blok.`,
    `Langkah 2. ${fmtNum(h.prioritas)} blok berulang menjadi daftar prioritas akhir 2022.`,
    `Langkah 3. Jejak 2023 jatuh: ${fmtNum(h.jejak2023Prioritas)} dari ${fmtNum(h.jejak2023)} blok berjejak 2023 ada di blok prioritas (${fmtPct((100 * h.jejak2023Prioritas) / h.jejak2023)}). Menurut sel jejak: ${fmtPct((100 * h.sel2023Prioritas) / h.sel2023)}.`,
  ];

  return (
    <Card padded={false} className="flex min-w-0 flex-col overflow-hidden">
      <div className="relative h-[360px] md:h-[560px]">
        <ReplayMap blok={blok} langkah={langkah} view3d={view3d} kurangGerak={kurangGerak} />
      </div>
      <div className="flex flex-col gap-3 border-t border-line p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button varian="primer" onClick={putar} disabled={kurangGerak} aria-pressed={main}>
            {main ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
            {main ? "Jeda" : "Putar"}
          </Button>
          <div role="group" aria-label="Langkah manual" className="flex gap-1">
            {([1, 2, 3] as const).map((l) => (
              <Button key={l} varian={langkah === l ? "aksen" : "sekunder"} onClick={() => pilih(l)} aria-pressed={langkah === l} aria-label={`Langkah ${l}`} className="w-10 px-0">
                {l}
              </Button>
            ))}
          </div>
          <Button varian="sekunder" onClick={() => setView3d((v) => !v)} aria-pressed={!view3d} className="ml-auto">
            {view3d ? <MapIcon size={16} aria-hidden /> : <Layers size={16} aria-hidden />}
            {view3d ? "Tampilan 2D" : "Tampilan 3D"}
          </Button>
          {kurangGerak && <span className="text-[13px] text-ink-2">Animasi otomatis mati sesuai pengaturan gerak perangkat; pakai langkah 1, 2, 3.</span>}
        </div>
        <p aria-live="polite" className="text-[15px] font-medium leading-[22px] text-ink">{caption[langkah - 1]}</p>
        <ul aria-label="Legenda langkah" className="flex flex-col gap-1.5 text-[13px] leading-[18px] text-ink-2">
          {legenda.map((l) => (
            <li key={l.w} className="flex items-start gap-2">
              <span aria-hidden className="mt-1 h-3 w-5 shrink-0 rounded-sm" style={{ background: l.w }} />
              {l.teks}
            </li>
          ))}
          {view3d && <li className="font-medium text-ink">1 lantai = 1 tahun berjejak 2015–2024, bukan peluang terbakar. Satu menara = satu blok; api yang kembali ke kolom yang sama menumpuk lurus ke atas. Lapis 2024 tidak ditampilkan karena tidak dipakai dalam uji ini.</li>}
          <li className="flex items-center gap-2"><span aria-hidden className="w-5 shrink-0 border-t-[1.5px] border-dashed border-ink" />Jendela studi (peta hanya menampilkan jendela ini)</li>
        </ul>
      </div>
    </Card>
  );
}
