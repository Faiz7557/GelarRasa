import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

export default function BlokTidakDitemukan() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] font-bold leading-[34px] text-ink">Blok tidak ditemukan</h1>
      <EmptyState
        pesan="Nomor blok ini tidak ada di data TABAT."
        aksi={
          <Link href="/peta" className="inline-flex h-10 items-center rounded-control bg-ink px-4 text-[14px] font-medium text-white hover:bg-ink-2">
            Kembali ke Peta
          </Link>
        }
      />
    </div>
  );
}
