"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Skeleton } from "@/components/ui/Skeleton";

type Hasil = { teks: string; sumber: "ai" | "template" };

export function AiSummary({ elNino }: { elNino: boolean }) {
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [muat, setMuat] = useState(false);
  const [galat, setGalat] = useState(false);
  const [tersalin, setTersalin] = useState(false);

  async function tulis() {
    setMuat(true);
    setGalat(false);
    setTersalin(false);
    try {
      const r = await fetch(`/api/ringkasan-ai?elnino=${elNino ? 1 : 0}`);
      const j = (await r.json().catch(() => null)) as { data?: Hasil } | null;
      if (!r.ok || !j?.data) throw new Error();
      setHasil(j.data);
    } catch {
      setGalat(true);
    } finally {
      setMuat(false);
    }
  }

  async function salin() {
    try {
      await navigator.clipboard.writeText(hasil?.teks ?? "");
      setTersalin(true);
    } catch {
      setTersalin(false);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <CardTitle>Ringkasan untuk pimpinan</CardTitle>
        <DemoBadge />
      </div>
      {muat ? (
        <Skeleton className="h-24 w-full" />
      ) : galat ? (
        <ErrorCard onRetry={tulis} />
      ) : hasil ? (
        <div className="flex flex-col gap-3">
          <p className="text-[15px] leading-6 text-ink">{hasil.teks}</p>
          <p className="text-[13px] text-ink-3">{hasil.sumber === "ai" ? "ditulis AI dari angka TABAT" : "templat"}</p>
          <div className="flex flex-wrap gap-2">
            <Button varian="sekunder" onClick={salin}>
              {tersalin ? "Tersalin" : "Salin"}
            </Button>
            <Button varian="ghost" onClick={tulis}>
              Tulis ulang
            </Button>
          </div>
        </div>
      ) : (
        <Button varian="sekunder" onClick={tulis}>
          Tulis ringkasan untuk pimpinan
        </Button>
      )}
    </Card>
  );
}
