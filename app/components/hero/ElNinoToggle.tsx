import Link from "next/link";
import { cn } from "@/lib/cn";
import { heroHref } from "./href";

/** Sakelar "Tahun ini El Niño?" lewat query ?elnino=1 (tautan, bukan state lokal). */
export function ElNinoToggle({ aktif, kab, peta3d }: { aktif: boolean; kab?: string | null; peta3d?: boolean }) {
  return (
    <Link
      href={heroHref({ elnino: !aktif, kab, peta3d })}
      role="switch"
      aria-checked={aktif}
      scroll={false}
      className="inline-flex min-h-10 items-center gap-3 rounded-control border border-line-2 bg-panel px-3 py-2 text-[14px] font-medium text-ink hover:bg-panel-2"
    >
      <span aria-hidden className={cn("relative h-6 w-10 rounded-full transition-colors", aktif ? "bg-ink" : "bg-line-2")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-all", aktif ? "left-5" : "left-1")} />
      </span>
      Tahun ini El Niño?
      <span className="text-ink-3">{aktif ? "Ya · P1+P2" : "Tidak · P1"}</span>
    </Link>
  );
}
