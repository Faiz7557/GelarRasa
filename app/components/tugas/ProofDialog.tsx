"use client";

import { AKSI } from "@/lib/copy";
import { fmtTanggal } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { Bukti, TugasKartu } from "./types";
import { DemoBadge } from "@/components/ui/DemoBadge";

export function ProofDialog({ tugas, bukti, busy, galat, onClose, onSubmit }: { tugas: TugasKartu | null; bukti: Bukti | undefined; busy: boolean; galat: string | null; onClose: () => void; onSubmit: () => void }) {
  return (
    <Dialog open={!!tugas} onClose={onClose} judul={`Tandai terbukti, blok ${tugas?.block_id ?? ""}`}>
      {tugas && (
        <div className="flex flex-col gap-4">
          <p><DemoBadge /></p>
          {bukti ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bukti.foto} alt={`Foto kunjungan terakhir blok ${tugas.block_id}`} className="max-h-72 w-full rounded-control border border-line bg-panel-2 object-contain" />
              <dl className="grid grid-cols-3 gap-2 text-[14px]">
                <div>
                  <dt className="text-ink-3">Kunjungan</dt>
                  <dd className="text-ink">{fmtTanggal(bukti.tanggal)}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Muka air</dt>
                  <dd className="tabular-nums text-ink">{bukti.muka_air_cm == null ? "-" : `${bukti.muka_air_cm} cm`}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Kondisi tabat</dt>
                  <dd className="text-ink">{bukti.kondisi_tabat ?? "-"}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-ink-2">Belum ada kunjungan berfoto untuk blok ini.</p>
          )}
          {galat && (
            <p role="alert" className="text-[14px] text-telat-ink">
              {galat}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button varian="ghost" onClick={onClose}>
              {AKSI.batal}
            </Button>
            <Button varian="primer" disabled={busy || !bukti} onClick={onSubmit}>
              {AKSI.tandaiTerbukti}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
