"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PERSONA_LIST } from "@/lib/people";
import { RESET_FILTER } from "@/lib/copy";
import { Button } from "@/components/ui/Button";

const SEL = "h-10 rounded-control border border-line-2 bg-panel px-3 text-[14px] text-ink";

export function TaskFilters({ kabupaten, sayaId }: { kabupaten: { id: string; nama: string }[]; sayaId: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    if (v) n.set(k, v);
    else n.delete(k);
    const q = n.toString();
    router.replace(q ? `${path}?${q}` : path);
  };
  const saya = sp.get("pemilik") === sayaId;
  return (
    <div className="flex flex-wrap items-end gap-3" role="search" aria-label="Filter tugas">
      <label className="flex flex-col gap-1 text-[13px] text-ink-2">
        Pemilik
        <select className={SEL} value={sp.get("pemilik") ?? ""} onChange={(e) => set("pemilik", e.target.value)}>
          <option value="">Semua pemilik</option>
          {PERSONA_LIST.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-ink-2">
        Kabupaten
        <select className={SEL} value={sp.get("kab") ?? ""} onChange={(e) => set("kab", e.target.value)}>
          <option value="">Semua kabupaten</option>
          {kabupaten.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[13px] text-ink-2">
        Urgensi
        <select className={SEL} value={sp.get("urgensi") ?? ""} onChange={(e) => set("urgensi", e.target.value)}>
          <option value="">Semua</option>
          <option value="terlambat">Terlambat</option>
          <option value="minggu_ini">Minggu ini</option>
        </select>
      </label>
      <label className="flex h-10 items-center gap-2 text-[14px] text-ink">
        <input type="checkbox" className="h-4 w-4" checked={saya} onChange={(e) => set("pemilik", e.target.checked ? sayaId : "")} />
        Hanya milik saya
      </label>
      {sp.toString() !== "" && (
        <Button varian="ghost" onClick={() => router.replace(path)}>
          {RESET_FILTER}
        </Button>
      )}
    </div>
  );
}
