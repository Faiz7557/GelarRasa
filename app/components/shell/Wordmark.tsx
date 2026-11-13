import Link from "next/link";
import { MEREK } from "@/lib/copy";

/** Wordmark TABAT + glif sekat (dua tiang, papan melintang di atas garis air). */
export function Wordmark({ href = "/" }: { href?: string | null }) {
  const inner = (
    <>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M7 4v13M17 4v13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M5 9h14" stroke="var(--sorot)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M2 20c2-1.5 3.5-1.5 5.5 0s3.5 1.5 5.5 0 3.5-1.5 5.5 0 2.5.8 3.5 0" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[20px] font-extrabold leading-6 tracking-wide">{MEREK}</span>
    </>
  );
  const cls = "inline-flex items-center gap-2 rounded-control";
  return href ? (
    <Link href={href} className={cls} aria-label={`${MEREK}, ke beranda`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
