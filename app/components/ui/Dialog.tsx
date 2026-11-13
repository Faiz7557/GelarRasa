"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { AKSI } from "@/lib/copy";

type Props = { open: boolean; onClose: () => void; judul: string; children: React.ReactNode; className?: string };

/** <dialog> native: showModal() memberi focus trap, Escape, dan aria-modal. */
export function Dialog({ open, onClose, judul, children, className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={cn("m-auto w-[min(92vw,480px)] rounded-card border border-line bg-panel p-0 text-ink shadow-[0_8px_24px_rgb(0_0_0/0.08)] backdrop:bg-ink/40", className)}
    >
      {open && (
        <div className="p-5">
          <div className="mb-3 flex items-start justify-between gap-4">
            <h2 id={titleId} className="font-display text-[18px] font-semibold leading-6">
              {judul}
            </h2>
            <button type="button" onClick={onClose} aria-label={AKSI.tutup} className="rounded-control p-1 text-ink-2 hover:bg-ink/5">
              <X size={20} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
