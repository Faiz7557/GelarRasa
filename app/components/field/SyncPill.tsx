import { Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/cn";

export function SyncPill({ luring, antre }: { luring: boolean; antre: number }) {
  const Ikon = luring ? CloudOff : Cloud;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium", luring ? "bg-segera-soft text-segera-ink" : "bg-siap-soft text-siap-ink")}>
      <Ikon size={16} strokeWidth={1.75} aria-hidden />
      {luring ? "Luring" : "Daring"} · {antre} antre
    </span>
  );
}
