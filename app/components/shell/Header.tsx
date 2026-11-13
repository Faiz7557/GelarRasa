"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { AKSI, SHELL } from "@/lib/copy";
import { PERSONA_LIST, type Persona, type PersonaId } from "@/lib/people";
import { Wordmark } from "./Wordmark";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Button } from "@/components/ui/Button";

function Avatar({ p, className }: { p: Persona; className?: string }) {
  return (
    <span aria-hidden className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sorot text-[12px] font-medium text-ink", className)}>
      {p.inisial}
    </span>
  );
}

export function Header({ persona }: { persona: Persona }) {
  const router = useRouter();
  const menu = useRef<HTMLDetailsElement>(null);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [sibuk, setSibuk] = useState(false);

  async function post(url: string, body?: unknown) {
    return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  }

  async function ganti(id: PersonaId) {
    if (menu.current) menu.current.open = false;
    if (id === persona.id) return;
    try {
      const r = await post("/api/auth/ganti", { persona: id });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setPesan({ ok: false, teks: SHELL.gantiGagal });
    }
  }

  async function reset() {
    setSibuk(true);
    setPesan(null);
    try {
      const r = await post("/api/demo/reset");
      if (!r.ok) throw new Error();
      setPesan({ ok: true, teks: SHELL.resetBerhasil });
      router.refresh();
    } catch {
      setPesan({ ok: false, teks: SHELL.resetGagal });
    } finally {
      setSibuk(false);
    }
  }

  return (
    <header data-gelap className="border-b border-ground/15 bg-ink text-ground">
      <div className="flex min-h-[57px] items-center gap-3 px-4 py-2 md:px-6">
        <Wordmark />
        <div className="hidden sm:block">
          <CountdownBadge />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <details ref={menu} className="relative text-ink">
            <summary
              aria-label={`${persona.nama} ${persona.peran}, ${SHELL.pilihPersona}`}
              className="flex cursor-pointer list-none items-center gap-2 rounded-control border border-line-2 bg-panel px-2 py-1 marker:hidden [&::-webkit-details-marker]:hidden"
            >
              <Avatar p={persona} />
              <span className="hidden text-left leading-[18px] md:block">
                <span className="block text-[14px] font-medium">{persona.nama}</span>
                <span className="block text-[13px] text-ink-3">{persona.peran}</span>
              </span>
              <ChevronDown size={16} strokeWidth={1.75} aria-hidden className="text-ink-3" />
            </summary>
            <ul className="absolute right-0 z-10 mt-2 [&_:focus-visible]:outline-ink w-[min(86vw,288px)] rounded-card border border-line bg-panel p-1 shadow-[0_8px_24px_rgb(0_0_0/0.08)]">
              {PERSONA_LIST.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => ganti(p.id)}
                    aria-current={p.id === persona.id ? "true" : undefined}
                    className="flex w-full items-center gap-3 rounded-control px-2 py-2 text-left hover:bg-ink/5"
                  >
                    <Avatar p={p} />
                    <span className="flex-1 leading-[18px]">
                      <span className="block text-[14px] font-medium">{p.nama}</span>
                      <span className="block text-[13px] text-ink-3">{p.peran}</span>
                    </span>
                    {p.id === persona.id && <Check size={16} strokeWidth={1.75} aria-label="Persona aktif" />}
                  </button>
                </li>
              ))}
            </ul>
          </details>
          {persona.id === "koordinator" && (
            <Button varian="sekunder" onClick={reset} disabled={sibuk} aria-label={AKSI.resetDemo}>
              <RotateCcw size={16} strokeWidth={1.75} aria-hidden />
              <span className="hidden sm:inline">{sibuk ? SHELL.resetMemuat : AKSI.resetDemo}</span>
            </Button>
          )}
        </div>
      </div>
      {pesan && (
        <p role="status" className={cn("px-4 py-1.5 text-[13px] md:px-6", pesan.ok ? "bg-siap-soft text-siap-ink" : "bg-telat-soft text-telat-ink")}>
          {pesan.teks}
        </p>
      )}
    </header>
  );
}
