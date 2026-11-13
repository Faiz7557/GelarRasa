"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardPlus, Copy, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AKSI, PESAN_GALAT } from "@/lib/copy";

type Props = { id: number; lat: number; lon: number; bisaBuat: boolean };

function salin(teks: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = teks;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    ta.remove();
  }
}

export function BlockActions({ id, lat, lon, bisaBuat }: Props) {
  const router = useRouter();
  const [pesan, setPesan] = useState<{ teks: string; galat: boolean } | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function buat() {
    setSibuk(true);
    try {
      const r = await fetch("/api/tugas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ block_id: id, jenis: "periksa" }) });
      if (r.status === 201) {
        setPesan({ teks: "Tugas periksa diusulkan.", galat: false });
        router.refresh();
      } else if (r.status === 409) setPesan({ teks: "Sudah ada tugas aktif untuk blok ini.", galat: true });
      else setPesan({ teks: (await r.json().catch(() => null))?.error ?? PESAN_GALAT.umum, galat: true });
    } catch {
      setPesan({ teks: PESAN_GALAT.jaringan, galat: true });
    } finally {
      setSibuk(false);
    }
  }

  async function koordinat() {
    const teks = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(teks);
      ok = true;
    } catch {
      ok = salin(teks);
    }
    setPesan(ok ? { teks: `Koordinat disalin: ${teks}`, galat: false } : { teks: `Salin manual: ${teks}`, galat: true });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {bisaBuat && (
          <Button varian="primer" onClick={buat} disabled={sibuk}>
            <ClipboardPlus aria-hidden className="h-4 w-4" />
            {AKSI.buatTugas}
          </Button>
        )}
        <Link
          href={`/lapangan?blok=${id}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-control border border-line-2 bg-panel px-4 text-[14px] font-medium text-ink transition-colors hover:bg-panel-2"
        >
          <Smartphone aria-hidden className="h-4 w-4" />
          Buka di TABAT Lapangan
        </Link>
        <Button onClick={koordinat}>
          <Copy aria-hidden className="h-4 w-4" />
          Salin koordinat
        </Button>
      </div>
      <p role="status" className={`min-h-5 text-[13px] ${pesan?.galat ? "text-telat-ink" : "text-siap-ink"}`}>
        {pesan?.teks}
      </p>
    </div>
  );
}
