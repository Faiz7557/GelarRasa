"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { LABEL_KELAS } from "@/lib/copy";
import { fmtNum, fmtPct } from "@/lib/format";
import { capacityPlan, type BlockLite, type Kelas } from "@/lib/rules";
import { Button } from "@/components/ui/Button";
import { DemoBadge } from "@/components/ui/DemoBadge";
import CoverageChart, { type TitikKurva } from "@/components/charts/CoverageChart";

export const N_MIN = 50;
export const N_MAKS = 600;
export const BATCH_MAKS = 50;

const URUT: Kelas[] = ["P1", "P2", "CEK", "PANTAU"];

type Hasil = { dibuat: number; dilewati: number } | { galat: string };
export type Rencana = { blocks: BlockLite[]; pctLuasBerulang: number };

/** Hitung rencana kapasitas dari N (ditunda agar slider tetap licin). Dipakai PetaView agar peta/daftar ikut menyorot. */
export function useRencana(blok: BlockLite[], kurva: TitikKurva[], n: number, elNino: boolean): Rencana {
  const nTunda = useDeferredValue(n);
  return useMemo(() => capacityPlan([...blok], nTunda, { elNino, coverageCurve: kurva }), [blok, kurva, nTunda, elNino]);
}

export function SimulationDrawer({
  blok,
  kurva,
  elNino,
  onElNino,
  n,
  onN,
  rencana,
  koordinator,
}: {
  blok: BlockLite[];
  kurva: TitikKurva[];
  elNino: boolean;
  onElNino: (v: boolean) => void;
  n: number;
  onN: (v: number) => void;
  rencana: Rencana;
  koordinator: boolean;
}) {
  const [bekerja, setBekerja] = useState(false);
  const [hasil, setHasil] = useState<Hasil | null>(null);

  const total = useMemo(() => {
    const t: Record<string, number> = {};
    for (const b of blok) t[b.kelas] = (t[b.kelas] ?? 0) + 1;
    return t;
  }, [blok]);
  const wajib = (total.P1 ?? 0) + (elNino ? (total.P2 ?? 0) : 0);

  const jumlah = rencana.blocks.length;
  const x = rencana.pctLuasBerulang;
  const perKelas = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of rencana.blocks) c[b.kelas] = (c[b.kelas] ?? 0) + 1;
    return c;
  }, [rencana]);

  const keterangan = URUT.filter((k) => perKelas[k]).map((k) => {
    const c = perKelas[k];
    if (c === total[k]) return `semua ${LABEL_KELAS[k]}`;
    return k === "P1" ? `${fmtNum(c)} dari ${fmtNum(total[k])} ${LABEL_KELAS[k]}` : `${fmtNum(c)} ${LABEL_KELAS[k]}`;
  });
  const kurang = Math.max(0, wajib - jumlah);

  async function usulkan() {
    setBekerja(true);
    setHasil(null);
    try {
      const r0 = await fetch("/api/tugas");
      const j0 = await r0.json();
      if (!r0.ok) throw new Error(j0.error ?? "Gagal membaca tugas.");
      const aktif = new Set<number>(
        (j0.data as { block_id: number; jenis: string; status: string }[])
          .filter((t) => t.jenis === "periksa" && ["usulan", "disetujui", "diperiksa", "dirawat"].includes(t.status))
          .map((t) => t.block_id),
      );
      const belum = rencana.blocks.map((b) => b.block_id).filter((id) => !aktif.has(id));
      const lewat = jumlah - belum.length; // sudah punya tugas aktif
      const batch = belum.slice(0, BATCH_MAKS);
      if (batch.length === 0) {
        setHasil({ dibuat: 0, dilewati: lewat });
        return;
      }
      const r = await fetch("/api/tugas", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ block_ids: batch, jenis: "periksa" }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Gagal membuat usulan.");
      setHasil({ dibuat: j.data.dibuat, dilewati: j.data.dilewati + lewat });
    } catch (e) {
      setHasil({ galat: e instanceof Error ? e.message : "Gagal membuat usulan." });
    } finally {
      setBekerja(false);
    }
  }

  return (
    <section id="simulasi" aria-label="Simulasi kapasitas regu" className="rounded-card border border-line bg-panel p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <label className="flex items-center justify-between gap-3 rounded-control border border-line-2 px-3 py-2.5">
            <span className="text-[14px] font-medium text-ink">Tahun ini El Niño?</span>
            <span className="flex items-center gap-2 text-[13px] text-ink-2">
              {elNino ? "Ya" : "Tidak"}
              <input type="checkbox" role="switch" checked={elNino} onChange={(e) => onElNino(e.target.checked)} className="h-5 w-9 cursor-pointer accent-[var(--el-nino)]" />
            </span>
          </label>

          <div>
            <label htmlFor="sim-n" className="text-[14px] font-medium text-ink">
              Regu sanggup N kunjungan sebelum Agustus
            </label>
            <p className="mt-1 font-display text-[40px] font-bold leading-none tabular-nums text-ink">{fmtNum(n)}</p>
            <input id="sim-n" type="range" min={N_MIN} max={N_MAKS} step={10} value={n} onChange={(e) => onN(Number(e.target.value))} className="mt-3 w-full cursor-pointer accent-[var(--tipe-3)]" />
            <div className="flex justify-between text-[12px] tabular-nums text-ink-3">
              <span>{fmtNum(N_MIN)}</span>
              <span>{fmtNum(N_MAKS)}</span>
            </div>
          </div>

          {koordinator && (
            <div className="flex flex-col gap-2">
              <Button varian="aksen" onClick={usulkan} disabled={bekerja || jumlah === 0}>
                {bekerja ? "Membuat usulan…" : n > BATCH_MAKS ? `Usulkan ${BATCH_MAKS} tugas berikutnya` : `Usulkan ${fmtNum(n)} tugas`}
              </Button>
              {hasil && (
                <p className="text-[13px] text-ink-2" role="status">
                  {"galat" in hasil ? (
                    hasil.galat
                  ) : (
                    <>
                      <span className="tabular-nums">{fmtNum(hasil.dibuat)}</span> dibuat, <span className="tabular-nums">{fmtNum(hasil.dilewati)}</span> dilewati <DemoBadge className="align-middle" />{" "}
                      <Link href="/tugas?status=usulan" className="font-medium text-ink underline underline-offset-2">
                        Lihat usulan di Tugas
                      </Link>
                    </>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-[16px] leading-6 text-ink" aria-live="polite">
            <strong className="tabular-nums">{fmtNum(jumlah)}</strong> kunjungan menyentuh <strong className="tabular-nums">{fmtPct(x)}</strong> luas berulang 2015–2024
          </p>
          <p className="text-[13px] leading-5 text-ink-2">
            Tercakup: {keterangan.join(" + ") || "belum ada"}.{" "}
            <span className="text-ink-3">
              Wajib {elNino ? "Prioritas 1 + Prioritas 2" : "Prioritas 1"}: {fmtNum(wajib)} blok
              {kurang > 0 ? `, ${fmtNum(kurang)} blok belum tercakup.` : ", semuanya tercakup."}
            </span>
          </p>
          <CoverageChart kurva={kurva} n={jumlah} y={x} xMaks={N_MAKS} />
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-3">
            <span className="flex items-center gap-1.5">
              <span className="h-[2.5px] w-5 rounded bg-tipe-3" /> TABAT (urut prioritas)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 border-t-[1.5px] border-dashed border-ink-3" /> Blok acak
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
