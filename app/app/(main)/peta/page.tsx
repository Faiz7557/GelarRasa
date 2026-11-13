import { JUDUL_LAYAR } from "@/lib/copy";
import { all } from "@/lib/db";
import { getBlokList, getCoverageCurve } from "@/lib/data";
import { getSession } from "@/lib/auth";
import type { BlockLite } from "@/lib/rules";
import { StepperTABAT } from "@/components/ui/StepperTABAT";
import { PetaView } from "@/components/peta/PetaView";
import { KELAS_PETA, STATUS_PETA, type BlokPeta, type FilterPeta } from "@/components/peta/types";

type SP = Record<string, string | string[] | undefined>;

/** Filter awal dari URL, divalidasi. */
function filterDariParams(sp: SP, kabIds: string[]): FilterPeta {
  const p = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const daftar = <T extends string>(k: string, ok: readonly T[]) => p(k).split(",").filter((x): x is T => (ok as readonly string[]).includes(x));
  return { kelas: daftar("kelas", KELAS_PETA), kab: kabIds.includes(p("kab")) ? p("kab") : "", kurang4: p("kurang4") === "1", status: daftar("status", STATUS_PETA) };
}

export default async function Peta({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  // getBlokList bertipe longgar (Record<string, unknown>); tegaskan kolom yang dipakai.
  type Baris = Omit<BlokPeta, "kab"> & { kab: string | null };
  const blok: BlokPeta[] = (getBlokList({ limit: 2000 }) as unknown as Baris[])
    .filter((b) => (KELAS_PETA as string[]).includes(b.kelas))
    .map((b) => ({ block_id: b.block_id, kab: b.kab ?? "", kelas: b.kelas, tipe: b.tipe, hotspot: b.hotspot, last_year: b.last_year, full_obs_years: b.full_obs_years, status: b.status }));
  const kabs = all<{ kab_id: string; nama: string }>("select kab_id, nama from kabupaten where fokus = 1 order by nama");
  // Bahan capacityPlan (kelas yang bisa diusulkan; LAIN tidak dimuat).
  const rencanaBlok = all<BlockLite>("select block_id, kelas, tipe, hotspot, repeated_cells, last_year, gi_z from blocks where kelas != 'LAIN'");
  const sesi = await getSession();

  return (
    <div className="flex flex-col gap-4">
      <StepperTABAT aktif={0} />
      <h1 className="font-display text-[28px] font-bold leading-[34px] text-ink">{JUDUL_LAYAR.peta}</h1>
      <PetaView
        blok={blok}
        kabs={kabs}
        awal={filterDariParams(sp, kabs.map((k) => k.kab_id))}
        rencanaBlok={rencanaBlok}
        kurva={getCoverageCurve()}
        koordinator={sesi?.id === "koordinator"}
        simAwal={(Array.isArray(sp.sim) ? sp.sim[0] : sp.sim) === "1"}
      />
    </div>
  );
}
