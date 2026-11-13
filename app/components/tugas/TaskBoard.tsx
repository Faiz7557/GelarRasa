"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LABEL_STATUS_TUGAS, PESAN_GALAT, PESAN_KOSONG } from "@/lib/copy";
import { cn } from "@/lib/cn";
import type { Peran, StatusTugas } from "@/lib/rules";
import { ApproveDialog } from "./ApproveDialog";
import { ProofDialog } from "./ProofDialog";
import { RejectDialog } from "./RejectDialog";
import { TaskCard, type AksiKartu } from "./TaskCard";
import type { Bukti, TugasKartu } from "./types";
import { DemoBadge } from "@/components/ui/DemoBadge";

const KOLOM: StatusTugas[] = ["usulan", "disetujui", "diperiksa", "dirawat", "terbukti"];

export function TaskBoard({ tugas, peran, baseUrl, bukti }: { tugas: TugasKartu[]; peran: Peran; baseUrl: string; bukti: Record<number, Bukti> }) {
  const router = useRouter();
  const [aktif, setAktif] = useState<StatusTugas>("usulan");
  const [dlg, setDlg] = useState<{ aksi: AksiKartu; t: TugasKartu } | null>(null);
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const by = (s: StatusTugas) => tugas.filter((t) => t.status === s);
  const tutup = () => {
    setDlg(null);
    setGalat(null);
  };

  async function patch(t: TugasKartu, body: Record<string, unknown>) {
    setBusy(true);
    setGalat(null);
    try {
      const r = await fetch(`/api/tugas/${t.tugas_id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { error?: string } | null;
        setGalat(j?.error ?? PESAN_GALAT.tugasGagal);
        return;
      }
      tutup();
      router.refresh();
    } catch {
      setGalat(PESAN_GALAT.jaringan);
    } finally {
      setBusy(false);
    }
  }

  const onAksi = (aksi: AksiKartu, t: TugasKartu) => {
    setGalat(null);
    if (aksi === "dirawat") void patch(t, { aksi: "status", ke: "dirawat" });
    else if (aksi === "buka") void patch(t, { aksi: "buka" });
    else setDlg({ aksi, t });
  };

  const kartu = (t: TugasKartu) => <TaskCard key={t.tugas_id} t={t} peran={peran} baseUrl={baseUrl} onAksi={onAksi} />;
  const ditolak = by("ditolak");

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 text-[13px] text-ink-3">Semua tugas dan jumlahnya: <DemoBadge /></p>
      {galat && !dlg && (
        <p role="alert" className="rounded-control bg-telat-soft px-3 py-2 text-[14px] text-telat-ink">
          {galat}
        </p>
      )}
      {/* Tab status: hanya di layar sempit */}
      <div role="tablist" aria-label="Status tugas" className="flex gap-1 overflow-x-auto md:hidden">
        {KOLOM.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={aktif === s}
            onClick={() => setAktif(s)}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium", aktif === s ? "border-ink bg-ink text-white" : "border-line bg-panel text-ink-2")}
          >
            {LABEL_STATUS_TUGAS[s]} <span className="tabular-nums">{by(s).length}</span>
          </button>
        ))}
      </div>
      <div className="md:overflow-x-auto md:pb-2">
        <div className="md:flex md:min-w-max md:gap-4">
          {KOLOM.map((s) => (
            <section key={s} aria-label={LABEL_STATUS_TUGAS[s]} className={cn("flex-col gap-3 md:flex md:w-72 md:shrink-0", aktif === s ? "flex" : "hidden")}>
              <h2 className="hidden items-center justify-between font-display text-[16px] font-semibold text-ink md:flex">
                {LABEL_STATUS_TUGAS[s]}
                <span className="rounded-full bg-panel-2 px-2 text-[13px] tabular-nums text-ink-2">{by(s).length}</span>
              </h2>
              {by(s).length === 0 ? (
                <p className="rounded-card border border-dashed border-line-2 px-4 py-8 text-center text-[14px] text-ink-3">{PESAN_KOSONG.tugas}</p>
              ) : (
                <div className="flex flex-col gap-3 md:max-h-[70vh] md:overflow-y-auto md:pr-1">{by(s).map(kartu)}</div>
              )}
            </section>
          ))}
        </div>
      </div>

      <details className="rounded-card border border-line bg-panel">
        <summary className="cursor-pointer px-4 py-3 font-display text-[16px] font-semibold text-ink">
          {LABEL_STATUS_TUGAS.ditolak} <span className="text-[13px] tabular-nums text-ink-2">({ditolak.length})</span>
        </summary>
        <div className="grid gap-3 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-3">
          {ditolak.length === 0 ? <p className="text-[14px] text-ink-3">{PESAN_KOSONG.tugas}</p> : ditolak.map(kartu)}
        </div>
      </details>

      <ApproveDialog tugas={dlg?.aksi === "setujui" ? dlg.t : null} busy={busy} galat={galat} onClose={tutup} onSubmit={(pemilik, tenggat) => dlg && patch(dlg.t, { aksi: "setujui", pemilik, tenggat })} />
      <RejectDialog tugas={dlg?.aksi === "tolak" ? dlg.t : null} busy={busy} galat={galat} onClose={tutup} onSubmit={(alasan, catatan, alasan_sumber) => dlg && patch(dlg.t, { aksi: "tolak", alasan, alasan_sumber, ...(catatan && { catatan }) })} />
      <ProofDialog tugas={dlg?.aksi === "terbukti" ? dlg.t : null} bukti={dlg ? bukti[dlg.t.block_id] : undefined} busy={busy} galat={galat} onClose={tutup} onSubmit={() => dlg && patch(dlg.t, { aksi: "status", ke: "terbukti" })} />
    </div>
  );
}
