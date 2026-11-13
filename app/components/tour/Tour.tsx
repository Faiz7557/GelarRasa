"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { LANGKAH } from "./steps";

const KUNCI = "tabat:tur:selesai";
const LEBAR = 340;

/** Target pertama bertanda data-tour yang terlihat (sidebar desktop vs bar bawah mobile). */
function cari(kunci: string): HTMLElement | null {
  const semua = document.querySelectorAll<HTMLElement>(`[data-tour="${kunci}"]`);
  for (const el of semua) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

function tandai() {
  try {
    localStorage.setItem(KUNCI, "1");
  } catch {}
}

export function Tour() {
  const path = usePathname();
  const [idx, setIdx] = useState<number | null>(null);
  const tanpaTur = useSearchParams().get("tur") === "0"; // tangkapan layar / Playwright
  const [rect, setRect] = useState<DOMRect | null>(null);
  const dlg = useRef<HTMLDivElement>(null);
  const tombolTur = useRef<HTMLButtonElement>(null);

  // Tampil otomatis: hanya di "/", kunjungan pertama, bukan ?tur=0, storage harus bisa dibaca.
  useEffect(() => {
    if (path !== "/") return;
    try {
      if (new URLSearchParams(location.search).get("tur") === "0") return;
      if (localStorage.getItem(KUNCI)) return;
    } catch {
      return;
    }
    // Tunggu konten halaman (streaming) siap sebelum mulai; menyerah setelah ~6 dtk.
    let n = 0;
    const t = setInterval(() => {
      if (cari(LANGKAH[0].kunci)) {
        clearInterval(t);
        setIdx(0);
      } else if (++n > 20) clearInterval(t);
    }, 300);
    return () => clearInterval(t);
  }, [path]);

  const tutup = useCallback(() => {
    tandai();
    setIdx(null);
    tombolTur.current?.focus();
  }, []);

  // Cari langkah terdekat (searah) yang targetnya ada di layar ini; null bila habis.
  const ke = useCallback((dari: number, arah: 1 | -1) => {
    for (let i = dari; i >= 0 && i < LANGKAH.length; i += arah) if (cari(LANGKAH[i].kunci)) return i;
    return null;
  }, []);

  const lanjut = () => {
    if (idx === null) return;
    const n = ke(idx + 1, 1);
    if (n === null) tutup();
    else setIdx(n);
  };
  const kembali = () => {
    if (idx === null) return;
    const n = ke(idx - 1, -1);
    if (n !== null) setIdx(n);
  };

  const ukur = useCallback(() => {
    if (idx === null) return;
    const el = cari(LANGKAH[idx].kunci);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [idx]);

  useEffect(() => {
    if (idx === null) return;
    const el = cari(LANGKAH[idx].kunci);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    const raf = requestAnimationFrame(ukur);
    window.addEventListener("resize", ukur);
    window.addEventListener("scroll", ukur, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", ukur);
      window.removeEventListener("scroll", ukur, true);
    };
  }, [idx, ukur]);

  useEffect(() => {
    if (idx !== null) dlg.current?.focus();
  }, [idx]);

  // Target langkah aktif tidak ada di layar ini: lompat ke yang ada (bila tak ada sama sekali, tampil di tengah).
  useEffect(() => {
    if (idx === null || cari(LANGKAH[idx].kunci)) return;
    const n = ke(idx + 1, 1);
    if (n === null) return;
    const t = setTimeout(() => setIdx(n), 0);
    return () => clearTimeout(t);
  }, [idx, ke]);

  useEffect(() => {
    if (idx === null) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [idx, tutup]);

  const vw = typeof window === "undefined" ? 1024 : window.innerWidth;
  const vh = typeof window === "undefined" ? 768 : window.innerHeight;
  let gaya: React.CSSProperties;
  if (vw < 640) gaya = { left: 8, right: 8, bottom: 72 };
  else if (rect) {
    const left = Math.min(Math.max(8, rect.left), vw - LEBAR - 8);
    const bawah = rect.bottom + 12 + 190 < vh;
    gaya = { left, width: LEBAR, top: bawah ? rect.bottom + 12 : Math.max(8, rect.top - 12 - 190) };
  } else gaya = { left: "50%", top: "50%", width: LEBAR, transform: "translate(-50%, -50%)" };

  const L = idx === null ? null : LANGKAH[idx];
  const teks = L ? L.isi(cari(L.kunci)) : "";

  return (
    <>
      {!tanpaTur && (
      <button
        ref={tombolTur}
        type="button"
        aria-label="Mulai tur pengenalan"
        onClick={() => setIdx(ke(0, 1) ?? 0)}
        className="fixed bottom-20 right-4 z-30 md:left-6 md:right-auto flex h-11 items-center gap-1.5 rounded-full border border-line-2 bg-panel px-3 text-[14px] font-medium text-ink-2 shadow-sm hover:bg-panel-2 md:bottom-6"
      >
        <HelpCircle size={18} aria-hidden />
        Tur
      </button>
      )}
      {L && idx !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-ink/30" aria-hidden onClick={tutup} />
          {rect && (
            <div
              aria-hidden
              className="pointer-events-none fixed z-40 rounded-control bg-panel/0 outline outline-2 outline-ink"
              style={{ left: rect.left - 4, top: rect.top - 4, width: rect.width + 8, height: rect.height + 8 }}
            />
          )}
          <div
            ref={dlg}
            role="dialog"
            aria-modal="false"
            aria-labelledby="tur-judul"
            tabIndex={-1}
            style={gaya}
            className="fixed z-50 max-w-[calc(100vw-16px)] rounded-card border border-line bg-panel p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)] outline-none"
          >
            <p className="text-[13px] text-ink-3" aria-live="polite">
              {idx + 1} dari {LANGKAH.length}
            </p>
            <h2 id="tur-judul" className="font-display text-[18px] font-semibold">
              {L.judul}
            </h2>
            <p className="mt-1 text-[15px] text-ink-2">{teks}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button type="button" onClick={tutup} className="h-10 rounded-control px-3 text-[14px] text-ink-2 hover:bg-ink/5">
                Tutup
              </button>
              <div className="flex gap-2">
                {idx > 0 && (
                  <button type="button" onClick={kembali} className="h-10 rounded-control border border-line-2 px-4 text-[14px] font-medium hover:bg-panel-2">
                    Kembali
                  </button>
                )}
                <button type="button" onClick={lanjut} className="h-10 rounded-control bg-ink px-4 text-[14px] font-medium text-white hover:bg-ink-2">
                  {idx === LANGKAH.length - 1 ? "Selesai" : "Lanjut"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
