"use client";

import { useState } from "react";
import { ALASAN, AKSI, LABEL_ALASAN, PESAN_GALAT } from "@/lib/copy";
import type { Alasan } from "@/lib/reasons";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { TugasKartu } from "./types";

export type SumberAlasan = "pilih" | "kata_kunci" | "ai";
type P = { busy: boolean; galat: string | null; onClose: () => void; onSubmit: (alasan: Alasan, catatan: string, sumber: SumberAlasan) => void };

const LABEL_SUMBER: Record<string, string> = { kata_kunci: "kata kunci", ai: "ditulis AI dari teks Anda" };

export function RejectDialog({ tugas, ...p }: P & { tugas: TugasKartu | null }) {
  return (
    <Dialog open={!!tugas} onClose={p.onClose} judul={`Tolak usulan blok ${tugas?.block_id ?? ""}`}>
      {tugas && <Isi key={tugas.tugas_id} {...p} />}
    </Dialog>
  );
}

function Isi({ busy, galat, onClose, onSubmit }: P) {
  const [alasan, setAlasan] = useState<Alasan | "">("");
  const [teks, setTeks] = useState("");
  const [sumber, setSumber] = useState<SumberAlasan>("pilih");
  const [info, setInfo] = useState<string | null>(null);
  const [sortir, setSortir] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function doSortir() {
    setSortir(true);
    setErr(null);
    try {
      const r = await fetch("/api/alasan/sortir", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ teks }) });
      const j = (await r.json().catch(() => null)) as { data?: { alasan: Alasan; sumber: SumberAlasan }; error?: string } | null;
      if (!r.ok || !j?.data) return setErr(j?.error ?? PESAN_GALAT.tugasGagal);
      setAlasan(j.data.alasan);
      setSumber(j.data.sumber);
      setInfo(`Disortir: ${LABEL_ALASAN[j.data.alasan]} (sumber: ${LABEL_SUMBER[j.data.sumber] ?? j.data.sumber})`);
    } catch {
      setErr(PESAN_GALAT.jaringan);
    } finally {
      setSortir(false);
    }
  }

  const pesan = err ?? galat;
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (alasan) onSubmit(alasan, teks.trim(), sumber);
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-[14px] text-ink-2">Pilih alasan</legend>
        {ALASAN.map((a) => (
          <label key={a} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control border px-3 text-[15px] text-ink ${alasan === a ? "border-ink bg-ink/5" : "border-line-2"}`}>
            <input
              type="radio"
              name="alasan"
              value={a}
              checked={alasan === a}
              onChange={() => {
                setAlasan(a);
                setSumber("pilih");
                setInfo(null);
              }}
              className="size-4"
            />
            {LABEL_ALASAN[a]}
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-2">
        <label htmlFor="alasan-teks" className="text-[14px] text-ink-2">
          Atau tulis dengan kata sendiri
        </label>
        <textarea id="alasan-teks" className="min-h-20 rounded-control border border-line-2 bg-panel p-3 text-[14px] text-ink" maxLength={500} value={teks} onChange={(e) => setTeks(e.target.value)} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] tabular-nums text-ink-3">{teks.length}/500</span>
          <Button varian="sekunder" onClick={doSortir} disabled={sortir || !teks.trim()}>
            {sortir ? "Menyortir…" : "Sortir"}
          </Button>
        </div>
        {info && (
          <p role="status" className="text-[14px] text-ink">
            {info}
          </p>
        )}
      </div>
      {pesan && (
        <p role="alert" className="text-[14px] text-telat-ink">
          {pesan}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button varian="ghost" onClick={onClose}>
          {AKSI.batal}
        </Button>
        <Button type="submit" varian="primer" disabled={busy || !alasan}>
          {AKSI.tolak}
        </Button>
      </div>
    </form>
  );
}
