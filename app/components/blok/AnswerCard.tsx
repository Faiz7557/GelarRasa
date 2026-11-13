import { CalendarClock, Construction, Droplets, Flame } from "lucide-react";
import { Badge, type BadgeVarian } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/DemoBadge";

export type Urgensi = "terlambat" | "minggu_ini" | "bulan_ini" | "aman";
const URG: Record<Urgensi, { label: string; varian: BadgeVarian }> = {
  terlambat: { label: "Terlambat", varian: "telat" },
  minggu_ini: { label: "Minggu ini", varian: "segera" },
  bulan_ini: { label: "Bulan ini", varian: "segera" },
  aman: { label: "Aman", varian: "siap" },
};

type Props = { jawaban: { riwayat: string; kondisi: string; tindakan: string; tenggat: string }; urgensi: Urgensi };

export function AnswerCard({ jawaban, urgensi }: Props) {
  const u = URG[urgensi];
  const baris = [
    { Ikon: Flame, judul: "Riwayat", teks: jawaban.riwayat },
    { Ikon: Droplets, judul: "Kondisi", teks: jawaban.kondisi, demo: true },
    { Ikon: Construction, judul: "Tindakan", teks: jawaban.tindakan, demo: true },
    { Ikon: CalendarClock, judul: "Tenggat", teks: jawaban.tenggat, badge: u, demo: true },
  ];
  return (
    <Card aria-label="Jawaban singkat" className="p-5 sm:p-6">
      <dl className="flex flex-col divide-y divide-line">
        {baris.map(({ Ikon, judul, teks, demo, badge }) => (
          <div key={judul} className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 py-3 first:pt-0 last:pb-0">
            <Ikon aria-hidden className="row-span-2 mt-0.5 h-5 w-5 shrink-0 text-ink-2" />
              <dt className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
                {judul}
                {demo && <DemoBadge />}
              </dt>
              <dd className="mt-0.5 text-[18px] leading-7 text-ink">
                {teks} {badge && <Badge varian={badge.varian} className="ml-1 align-middle">{badge.label}</Badge>}
              </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
