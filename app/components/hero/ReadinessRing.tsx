import { fmtPct } from "@/lib/format";

/** Cincin persen siap. Warna menurut ambang; teks persen selalu tampil. */
export function ReadinessRing({ pct, ukuran = 144 }: { pct: number; ukuran?: number }) {
  const sw = 14;
  const r = (ukuran - sw) / 2;
  const k = 2 * Math.PI * r;
  const warna = pct >= 80 ? "var(--siap)" : pct >= 40 ? "var(--segera)" : "var(--telat)";
  return (
    <div className="relative shrink-0" style={{ width: ukuran, height: ukuran }} role="img" aria-label={`${fmtPct(pct)} blok prioritas siap`}>
      <svg width={ukuran} height={ukuran} className="-rotate-90" aria-hidden>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={warna} strokeWidth={sw} strokeLinecap="round" strokeDasharray={k} strokeDashoffset={k * (1 - Math.min(100, pct) / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[28px] font-semibold tabular-nums text-ink">{fmtPct(pct)}</span>
    </div>
  );
}
