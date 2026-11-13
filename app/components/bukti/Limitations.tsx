import { Info } from "lucide-react";

const BATAS = [
  "Satu tahun uji: 2023. Hasil ini belum diuji pada tahun lain.",
  "Jejak adalah bukti positif MODIS (MCD64A1), bukan ukuran luas terbakar yang tepat.",
  "Hanya berlaku di jendela studi; di luar jendela tidak diukur.",
  "Yang diukur adalah arah prioritas, bukan dampak pemeriksaan atau perawatan tabat.",
];

export function Limitations() {
  return (
    <section aria-labelledby="batasan" className="rounded-card border border-line bg-panel-2 p-5">
      <h2 id="batasan" className="flex items-center gap-2 font-display text-[18px] font-semibold leading-6 text-ink">
        <Info size={18} aria-hidden /> Batasan putar ulang ini
      </h2>
      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-[22px] text-ink-2">
        {BATAS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </section>
  );
}
