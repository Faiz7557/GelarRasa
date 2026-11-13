"use client";

import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import { AKSI, PESAN_GALAT } from "@/lib/copy";
import { Button } from "./Button";

export function ErrorCard({ pesan = PESAN_GALAT.umum, onRetry, className }: { pesan?: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-start gap-3 rounded-card border border-telat/30 bg-telat-soft p-5 text-telat-ink", className)}>
      <p className="flex items-center gap-2 font-medium">
        <TriangleAlert size={20} strokeWidth={1.75} aria-hidden />
        {pesan}
      </p>
      {onRetry && (
        <Button varian="sekunder" onClick={onRetry}>
          {AKSI.cobaLagi}
        </Button>
      )}
    </div>
  );
}
