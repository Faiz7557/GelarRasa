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

  const input = "h-11 w-full rounded-control border border-line-2 bg-panel px-3 text-[15px]";

  return (
    <div className="flex flex-col gap-4">
      <Button varian="primer" ukuran="lg" className="w-full" disabled={sibuk} onClick={() => kirim({ demo: true })}>
        {sibuk ? MASUK.memuat : AKSI.masukDemo}
      </Button>

      <details className="rounded-control border border-line bg-panel-2 px-4 py-3">
        <summary className="cursor-pointer text-[14px] font-medium text-ink-2">{MASUK.formSummary}</summary>
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            kirim({ email: f.get("email"), sandi: f.get("sandi") });
          }}
        >
          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink-2">
            {MASUK.email}
            <input name="email" type="email" required autoComplete="username" placeholder="rina@tabat.demo" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-ink-2">
            {MASUK.sandi}
            <input name="sandi" type="password" required autoComplete="current-password" className={input} />
          </label>
          <Button type="submit" varian="sekunder" disabled={sibuk}>
            {AKSI.masuk}
          </Button>
        </form>
      </details>

      {galat && (
        <p role="alert" className="rounded-control bg-telat-soft px-3 py-2 text-[14px] text-telat-ink">
          {galat}
        </p>
      )}
    </div>
  );
}
