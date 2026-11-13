"use client";

import { useEffect, useState } from "react";

/** Angka hari menuju tenggat; hitung naik sekali (≤ 600 ms), diam bila prefers-reduced-motion. */
export function HeroCountdown({ hari }: { hari: number }) {
  const [n, setN] = useState(hari);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      setN(Math.round(hari * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hari]);
  return (
    <p data-tour="hitung-mundur" className="flex items-baseline gap-3">
      <span className="font-display text-[48px] font-semibold leading-[52px] tabular-nums text-ink md:text-[64px] md:leading-[68px]">{n}</span>
      <span className="text-[16px] text-ink-2">hari menuju 1 Agu</span>
    </p>
  );
}
