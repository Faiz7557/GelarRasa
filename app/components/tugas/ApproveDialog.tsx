"use client";

import { useState } from "react";
import { AKSI } from "@/lib/copy";
import { PEOPLE } from "@/lib/people";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { TugasKartu } from "./types";

const PILIHAN = [PEOPLE.regu, PEOPLE.pengelola];
const FIELD = "h-10 rounded-control border border-line-2 bg-panel px-3 text-[14px] text-ink";

type P = { busy: boolean; galat: string | null; onClose: () => void; onSubmit: (pemilik: string, tenggat: string) => void };

export function ApproveDialog({ tugas, ...p }: P & { tugas: TugasKartu | null }) {
  return (
    <Dialog open={!!tugas} onClose={p.onClose} judul={`Setujui tugas blok ${tugas?.block_id ?? ""}`}>
      {tugas && <Isi key={tugas.tugas_id} tugas={tugas} {...p} />}
    </Dialog>
  );
}

function Isi({ tugas, busy, galat, onClose, onSubmit }: P & { tugas: TugasKartu }) {
  const [pemilik, setPemilik] = useState<string>("regu");
  const [tenggat, setTenggat] = useState(tugas.tenggatBawaan);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(pemilik, tenggat);
      }}
    >
      <label className="flex flex-col gap-1 text-[14px] text-ink-2">
        Pemilik tugas
        <select className={FIELD} value={pemilik} onChange={(e) => setPemilik(e.target.value)}>
          {PILIHAN.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama} · {p.peran}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-[14px] text-ink-2">
        Tenggat
        <input type="date" required className={FIELD} value={tenggat} onChange={(e) => setTenggat(e.target.value)} />
      </label>
      {galat && (
        <p role="alert" className="text-[14px] text-telat-ink">
          {galat}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button varian="ghost" onClick={onClose}>
          {AKSI.batal}
        </Button>
        <Button type="submit" varian="primer" disabled={busy || !tenggat}>
          {AKSI.setujui}
        </Button>
      </div>
    </form>
  );
}
