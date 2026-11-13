import { cn } from "@/lib/cn";

export type BadgeVarian = "telat" | "segera" | "siap" | "demo" | "netral";

const VARIAN: Record<BadgeVarian, string> = {
  telat: "bg-telat-soft text-telat-ink",
  segera: "bg-segera-soft text-segera-ink",
  siap: "bg-siap-soft text-siap-ink",
  demo: "border border-dashed border-ink bg-transparent text-ink",
  netral: "bg-panel-2 text-ink-2 border border-line",
};

/** Lencana status: selalu berisi teks (children), warna saja tidak cukup. */
export function Badge({ varian = "netral", className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { varian?: BadgeVarian }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-medium leading-[18px]", VARIAN[varian], className)}
      {...p}
    />
  );
}
