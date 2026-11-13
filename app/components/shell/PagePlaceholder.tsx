import { PESAN_KOSONG, PESAN_SEGERA } from "@/lib/copy";
import { EmptyState } from "@/components/ui/EmptyState";
import { StepperTABAT } from "@/components/ui/StepperTABAT";

/** Kerangka layar sementara: judul + (opsional) stepper + EmptyState. Diganti task layar masing-masing. */
export function PagePlaceholder({ judul, kunci, langkah, subjudul }: { judul: string; kunci: string; langkah?: 0 | 1 | 2 | 3 | 4; subjudul?: string }) {
  return (
    <div className="flex flex-col gap-4">
      {langkah !== undefined && <StepperTABAT aktif={langkah} />}
      <h1 className="font-display text-[28px] font-bold leading-[34px] text-ink">{judul}</h1>
      {subjudul && <p className="text-ink-2">{subjudul}</p>}
      <EmptyState pesan={`${PESAN_KOSONG[kunci] ?? PESAN_KOSONG.umum} ${PESAN_SEGERA}`} />
    </div>
  );
}
