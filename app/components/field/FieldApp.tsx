"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Settings, Trash2 } from "lucide-react";
import Link from "next/link";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { PESAN_GALAT } from "@/lib/copy";
import { daftarAntre, hapus, kirimAntre, luring as cekLuring, modeLuring, setModeLuring, tambah, ubahAntre, type ItemAntre, type Payload } from "@/lib/queue";
import { FieldForm } from "./FieldForm";
import { SyncPill } from "./SyncPill";
import { TaskList } from "./TaskList";
import { Toast } from "./Toast";
import { K_TUGAS, ambilTugas, bacaJson, muatTabat, tulisJson } from "./helpers";
import type { TugasLap } from "./types";

type Cache = { persona: string; asOf: string; items: TugasLap[] };
type Pilihan = { tugas: TugasLap | null; blockId: number };

export function FieldApp({ persona, blokAwal }: { persona: string; blokAwal: number | null }) {
  const [items, setItems] = useState<TugasLap[]>([]);
  const [asOf, setAsOf] = useState("");
  const [fase, setFase] = useState<"memuat" | "ok" | "galat" | "auth">("memuat");
  const [dariCache, setDariCache] = useState(false);
  const [pilih, setPilih] = useState<Pilihan | null>(null);
  const [antre, setAntre] = useState<ItemAntre[]>([]);
  const [flagLuring, setFlagLuring] = useState(false);
  const [online, setOnline] = useState(true);
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<{ teks: string; galat?: boolean } | null>(null);
  const awalDipakai = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const luring = flagLuring || !online;
  const bisaCatat = persona !== "kampus";

  const info = useCallback((teks: string, galat?: boolean) => {
    setToast({ teks, galat });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const muat = useCallback(async () => {
    const c = bacaJson<Cache>(K_TUGAS);
    const pakaiCache = () => {
      if (c && c.persona === persona) {
        setItems(c.items);
        setAsOf(c.asOf);
        setDariCache(true);
        setFase("ok");
      } else setFase("galat");
    };
    if (cekLuring()) return pakaiCache();
    try {
      const r = await ambilTugas(persona);
      setItems(r.items);
      setAsOf(r.asOf || c?.asOf || "");
      setDariCache(false);
      setFase("ok");
      tulisJson(K_TUGAS, { persona, asOf: r.asOf, items: r.items });
      void (async () => {
        for (const t of r.items.slice(0, 12)) await muatTabat(t.block_id);
      })();
    } catch (e) {
      if ((e as Error).message === "auth") setFase("auth");
      else pakaiCache();
    }
  }, [persona]);

  // status awal dari ponsel + pendengar
  useEffect(() => {
    const sinkron = () => {
      setAntre(daftarAntre());
      setFlagLuring(modeLuring());
      setOnline(navigator.onLine);
    };
    sinkron();
    const lepas = ubahAntre(sinkron);
    window.addEventListener("online", sinkron);
    window.addEventListener("offline", sinkron);
    navigator.geolocation?.getCurrentPosition(
      (p) => setPos([p.coords.longitude, p.coords.latitude]),
      () => {},
      { timeout: 5000 },
    );
    return () => {
      lepas();
      window.removeEventListener("online", sinkron);
      window.removeEventListener("offline", sinkron);
    };
  }, []);

  // muat tugas; muat ulang bila status luring berubah
  useEffect(() => {
    const id = setTimeout(() => void muat(), 0);
    return () => clearTimeout(id);
  }, [muat, luring]);

  // pengirim: saat daring, tiap 15 detik, dan saat luring dimatikan
  useEffect(() => {
    if (luring) return;
    const kirim = async () => {
      if ((await kirimAntre()) > 0) {
        info("Kunjungan terkirim.");
        void muat();
      }
    };
    void kirim();
    const id = setInterval(kirim, 15000);
    return () => clearInterval(id);
  }, [luring, muat, info]);

  // ?blok= dari Kartu Lokasi
  useEffect(() => {
    if (fase !== "ok" || awalDipakai.current || blokAwal == null) return;
    awalDipakai.current = true;
    setPilih({ tugas: items.find((t) => t.block_id === blokAwal) ?? null, blockId: blokAwal });
  }, [fase, items, blokAwal]);

  function simpan(p: Omit<Payload, "client_id">) {
    if (!tambah(p)) return info("Penyimpanan ponsel penuh. Hapus kunjungan yang gagal dulu.", true);
    setPilih(null);
    info("Tersimpan di ponsel, terkirim saat ada sinyal");
    if (!cekLuring())
      void kirimAntre().then((n) => {
        if (n) {
          info("Kunjungan terkirim.");
          void muat();
        }
      });
  }

  const nAntre = antre.filter((i) => i.status === "antre").length;
  const gagal = antre.filter((i) => i.status === "gagal");
  const menunggu = new Set(antre.map((i) => i.payload.block_id));
  const tampilToast = <Toast teks={toast?.teks ?? null} galat={toast?.galat} />;

  if (pilih)
    return (
      <>
        <FieldForm persona={persona} tugas={pilih.tugas} blockId={pilih.blockId} asOf={asOf} pos={pos} onSimpan={simpan} onBatal={() => setPilih(null)} />
        {tampilToast}
      </>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <SyncPill luring={luring} antre={nAntre} />
        <div className="relative">
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            className="flex h-11 w-11 items-center justify-center rounded-control border border-line-2 bg-panel"
          >
            <Settings size={20} strokeWidth={1.75} aria-hidden />
          </button>
          {menu && (
            <div className="absolute right-0 top-12 z-20 w-64 rounded-card border border-line bg-panel p-3 shadow-lg">
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-[15px]">
                Mode luring (demo)
                <input type="checkbox" role="switch" checked={flagLuring} onChange={(e) => setModeLuring(e.target.checked)} className="h-6 w-6" />
              </label>
              <p className="text-[13px] text-ink-3">Menahan pengiriman walau ada sinyal.</p>
            </div>
          )}
        </div>
      </div>

      {nAntre > 0 && <p className="text-[15px] font-medium">{nAntre} kunjungan menunggu kirim</p>}
      {gagal.map((g) => (
        <div key={g.payload.client_id} role="alert" className="flex items-start justify-between gap-2 rounded-card border border-telat/30 bg-telat-soft p-3 text-[14px] text-telat-ink">
          <span>
            Blok {g.payload.block_id}: {g.pesan ?? PESAN_GALAT.antreanGagal}
          </span>
          <button type="button" aria-label="Hapus dari antrean" onClick={() => hapus(g.payload.client_id)} className="flex h-11 w-11 shrink-0 items-center justify-center">
            <Trash2 size={18} aria-hidden />
          </button>
        </div>
      ))}

      {!bisaCatat && <p className="rounded-card border border-line bg-panel p-4 text-[14px] text-ink-2">Peran Anda tidak mencatat kunjungan lapangan. Ganti persona ke regu atau pengelola.</p>}
      {dariCache && fase === "ok" && <p className="text-[13px] text-ink-3">Menampilkan tugas yang tersimpan di ponsel.</p>}

      {fase === "memuat" && <Skeleton className="h-24 w-full" />}
      {fase === "galat" && <ErrorCard onRetry={() => void muat()} />}
      {fase === "auth" && (
        <div role="alert" className="rounded-card border border-line bg-panel p-4 text-[15px]">
          Sesi berakhir.{" "}
          <Link href="/masuk" className="font-medium underline">
            Masuk lagi
          </Link>
        </div>
      )}
      {fase === "ok" && bisaCatat && <TaskList items={items} asOf={asOf} pos={pos} menunggu={menunggu} onPilih={(t) => setPilih({ tugas: t, blockId: t.block_id })} />}
      {tampilToast}
    </div>
  );
}
