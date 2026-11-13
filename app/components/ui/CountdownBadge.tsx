import { CalendarClock } from "lucide-react";
import { Badge } from "./Badge";
import { hariMenujuTenggat, labelHitungMundur } from "@/lib/copy";

/** Hitung mundur ke 1 Agu. `hari` opsional; default dihitung dari AS_OF/DEADLINE di copy.ts. */
export function CountdownBadge({ hari = hariMenujuTenggat() }: { hari?: number }) {
  return (
    <Badge varian="segera" className="tabular-nums">
      <CalendarClock size={14} strokeWidth={1.75} aria-hidden />
      {labelHitungMundur(hari)}
    </Badge>
  );
}
