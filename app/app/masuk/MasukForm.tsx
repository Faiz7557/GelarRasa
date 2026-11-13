"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AKSI, MASUK, PESAN_GALAT } from "@/lib/copy";
import { Button } from "@/components/ui/Button";

export function MasukForm() {
  const router = useRouter();
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function kirim(body: unknown) {
    setSibuk(true);
    setGalat(null);
    try {
      const r = await fetch("/api/auth/masuk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) {
        const j = (await r.json().catch(() => null)) as { error?: string } | null;
        setGalat(j?.error ?? PESAN_GALAT.umum);
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setGalat(PESAN_GALAT.jaringan);
    } finally {
      setSibuk(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button varian="primer" ukuran="lg" className="w-full" disabled={sibuk} onClick={() => kirim({ demo: true })}>
        {sibuk ? MASUK.memuat : AKSI.masukDemo}
      </Button>

      {galat && (
        <p role="alert" className="rounded-control bg-telat-soft px-3 py-2 text-[14px] text-telat-ink">
          {galat}
        </p>
      )}
    </div>
  );
}
