import { cn } from "@/lib/cn";

/** Status kosong: garis putus + teks pendek (docs/03 §7). `aksi` boleh berisi tombol/tautan. */
export function EmptyState({ pesan, aksi, className }: { pesan: string; aksi?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-card border border-dashed border-line-2 px-6 py-10 text-center", className)}>
      <p className="text-ink-2">{pesan}</p>
      {aksi}
    </div>
  );
}
