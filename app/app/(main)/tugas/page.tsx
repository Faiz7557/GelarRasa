import { headers } from "next/headers";
import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { JUDUL_LAYAR } from "@/lib/copy";
import { getMeta } from "@/lib/data";
import type { Peran } from "@/lib/rules";
import { StepperTABAT } from "@/components/ui/StepperTABAT";
import { TaskBoard } from "@/components/tugas/TaskBoard";
import { TaskFilters } from "@/components/tugas/TaskFilters";
import { bangunKartu, buktiPerBlok } from "@/components/tugas/server";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Tugas({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const persona = await getSession();
  const peran = (persona?.id ?? "kampus") as Peran;
  const semua = bangunKartu(getMeta().as_of);

  const kabupaten = [...new Map(semua.filter((t) => t.kab_id && t.kab).map((t) => [t.kab_id as string, t.kab as string])).entries()]
    .map(([id, nama]) => ({ id, nama }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  const pemilik = first(sp.pemilik);
  const kab = first(sp.kab);
  const urg = first(sp.urgensi);
  const tampil = semua.filter(
    (t) => (!pemilik || t.pemilik === pemilik) && (!kab || t.kab_id === kab) && (urg !== "terlambat" || t.terlambat) && (urg !== "minggu_ini" || t.mingguIni),
  );

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  const bisaBukti = peran === "koordinator" || peran === "kampus";
  const bukti = bisaBukti ? buktiPerBlok(tampil.filter((t) => t.has_foto_visit && (t.status === "diperiksa" || t.status === "dirawat")).map((t) => t.block_id)) : {};

  return (
    <div className="flex flex-col gap-4">
      <StepperTABAT aktif={2} />
      <h1 className="font-display text-[28px] font-bold leading-[34px] text-ink">{JUDUL_LAYAR.tugas}</h1>
      <Suspense>
        <TaskFilters kabupaten={kabupaten} sayaId={persona?.id ?? ""} />
      </Suspense>
      <TaskBoard tugas={tampil} peran={peran} baseUrl={`${proto}://${host}`} bukti={bukti} />
    </div>
  );
}
