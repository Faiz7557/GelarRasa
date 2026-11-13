import { cn } from "@/lib/cn";

export function Toast({ teks, galat }: { teks: string | null; galat?: boolean }) {
  if (!teks) return null;
  return (
    <div role="status" className={cn("fixed inset-x-4 bottom-4 z-50 mx-auto max-w-[448px] rounded-control px-4 py-3 text-[14px] font-medium text-white shadow-lg", galat ? "bg-telat-ink" : "bg-ink")}>
      {teks}
    </div>
  );
}
