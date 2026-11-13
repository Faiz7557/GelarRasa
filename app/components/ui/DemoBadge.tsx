import { cn } from "@/lib/cn";
import { Badge } from "./Badge";

/** Wajib pada setiap angka/baris dari seed atau ops (docs/02 §10). */
export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge varian="demo" className={cn("px-2 py-0 text-[12px] uppercase tracking-wide", className)} title="Data demo fiktif">
      demo
    </Badge>
  );
}
