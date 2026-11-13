"use client";

import { useEffect, useState } from "react";
import { Camera, Check, Droplets, Minus, Plus, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { LABEL_AKSES } from "@/lib/copy";
import { kompresFoto } from "@/lib/compress";
import { waterStatus } from "@/lib/rules";
import type { Payload } from "@/lib/queue";
import { jenisKunjungan, muatTabat } from "./helpers";
import type { TabatLap, TugasLap } from "./types";

const KONDISI = [
  ["baik", "Baik"],
  ["rembes", "Rembes"],
  ["rusak", "Rusak"],
  ["jebol", "Jebol"],
] as const;
const AKSES = ["jalan", "sungai", "sulit", "tidak_bisa"] as const;
const pil = (aktif: boolean) =>
  cn("min-h-12 rounded-control border px-3 text-[15px] font-medium", aktif ? "border-ink bg-ink text-white" : "border-line-2 bg-panel text-ink");

export function FieldForm({
  persona,
  tugas,
  blockId,
  asOf,
  pos,
  onSimpan,
  onBatal,
}: {
  persona: string;
  tugas: TugasLap | null;
  blockId: number;
  asOf: string;
  pos: [number, number] | null;
  onSimpan: (p: Omit<Payload, "client_id">) => void;
  onBatal: () => void;
}) {
  const [jenis, setJenis] = useState<"periksa" | "rawat">(persona === "regu" ? "periksa" : persona === "pengelola" ? "rawat" : jenisKunjungan(tugas));
  const [air, setAir] = useState("");
  const [tabatList, setTabatList] = useState<TabatLap[] | null | undefined>(undefined);
  const [tabatId, setTabatId] = useState<string | null>(null);
  const [kondisi, setKondisi] = useState<string | null>(null);
  const [akses, setAkses] = useState<string | null>(null);
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoGalat, setFotoGalat] = useState(false);
  const [proses, setProses] = useState(false);
  const [catatan, setCatatan] = useState("");

  useEffect(() => {
    muatTabat(blockId).then((t) => {
      setTabatList(t);
      if (t && t.length === 0) setKondisi("tidak_ada");
    });
  }, [blockId]);

  const nilai = air === "" ? null : Math.min(200, Number(air));
  const geser = (d: number) => setAir(String(Math.min(200, Math.max(0, (nilai ?? 40) + d))));
  const st = waterStatus(nilai);
  const tanpaTabat = kondisi === "tidak_ada";

  async function pilihFoto(f: File | undefined) {
    if (!f) return;
    setProses(true);
    setFotoGalat(false);
    try {
      setFoto(await kompresFoto(f));
    } catch {
      setFoto(null);
      setFotoGalat(true);
    }
    setProses(false);
  }

  function simpan() {
    onSimpan({
      block_id: blockId,
      jenis,
      tanggal: asOf || new Date().toISOString().slice(0, 10),
      muka_air_cm: nilai,
      tabat_id: tanpaTabat ? null : tabatId,
      kondisi_tabat: kondisi,
      akses_aktual: akses,
      foto,
      catatan: catatan.trim() || null,
      tugas_id: tugas?.tugas_id ?? null,
      lon: pos?.[0] ?? null,
      lat: pos?.[1] ?? null,
      koordinat_sumber: pos ? "gps" : "centroid",
    });
  }

  const label = "mb-2 block text-[15px] font-medium text-ink";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        simpan();
      }}
      className="flex flex-col gap-6 pb-8"
    >
      <div>
        <h2 className="font-display text-[22px] font-semibold">Blok {blockId}</h2>
        <p className="text-[14px] text-ink-2">{tugas ? `Tugas ${tugas.tugas_id}${tugas.kab ? ` · ${tugas.kab}` : ""}` : "Tanpa tugas terkait"}</p>
      </div>

      <fieldset>
        <legend className={label}>Jenis kunjungan</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["periksa", "rawat"] as const).map((j) => (
            <button
              key={j}
              type="button"
              aria-pressed={jenis === j}
              disabled={persona === "regu" ? j !== "periksa" : persona === "pengelola" ? j !== "rawat" : false}
              onClick={() => setJenis(j)}
              className={cn(pil(jenis === j), "disabled:opacity-40")}
            >
              {j === "periksa" ? "Periksa" : "Rawat"}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="air" className={label}>
          Muka air (cm)
        </label>
        <div className="flex items-center gap-2">
          <Button ukuran="lg" className="w-16 shrink-0" aria-label="Kurangi 5 cm" onClick={() => geser(-5)}>
            <Minus size={18} aria-hidden />5
          </Button>
          <input
            id="air"
            inputMode="numeric"
            value={air}
            placeholder="—"
            onChange={(e) => setAir(e.target.value.replace(/\D/g, "").slice(0, 3))}
            className="h-14 min-w-0 flex-1 rounded-control border border-line-2 bg-panel text-center font-display text-[32px] font-bold"
          />
          <Button ukuran="lg" className="w-16 shrink-0" aria-label="Tambah 5 cm" onClick={() => geser(5)}>
            <Plus size={18} aria-hidden />5
          </Button>
        </div>
        <p className={cn("mt-2 flex items-center gap-2 text-[15px] font-medium", st === "aman" ? "text-air-aman" : st === "kering" ? "text-air-kering" : "text-ink-3")}>
          {st === "aman" ? <Droplets size={18} aria-hidden /> : st === "kering" ? <TriangleAlert size={18} aria-hidden /> : null}
          {st === "aman" ? "Aman (40 cm atau kurang)" : st === "kering" ? "Kering (di atas 40 cm)" : "Belum diukur"}
        </p>
      </div>

      <fieldset>
        <legend className={label}>Tabat</legend>
        <div className="flex flex-col gap-2">
          {tabatList === undefined && <p className="text-[14px] text-ink-3">Memuat daftar tabat…</p>}
          {tabatList === null && <p className="text-[14px] text-ink-2">Daftar tabat belum ada di ponsel. Pilih kondisi di bawah.</p>}
          {(tabatList ?? []).map((t) => (
            <button
              key={t.tabat_id}
              type="button"
              aria-pressed={tabatId === t.tabat_id && !tanpaTabat}
              onClick={() => {
                setTabatId(t.tabat_id);
                if (tanpaTabat) setKondisi(null);
              }}
              className={cn(pil(tabatId === t.tabat_id && !tanpaTabat), "text-left")}
            >
              {t.tabat_id}
              {t.bahan ? ` · ${t.bahan}` : ""}
            </button>
          ))}
          {tabatList && (
            <button
              type="button"
              aria-pressed={tanpaTabat}
              onClick={() => {
                setKondisi("tidak_ada");
                setTabatId(null);
              }}
              className={cn(pil(tanpaTabat), "text-left")}
            >
              Tidak ada tabat
            </button>
          )}
        </div>
      </fieldset>

      {!tanpaTabat && (
        <fieldset>
          <legend className={label}>Kondisi tabat</legend>
          <div className="grid grid-cols-2 gap-2">
            {KONDISI.map(([k, l]) => (
              <button key={k} type="button" aria-pressed={kondisi === k} onClick={() => setKondisi(k)} className={cn(pil(kondisi === k), "h-14")}>
                {l}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={label}>Akses aktual</legend>
        <div className="grid grid-cols-2 gap-2">
          {AKSES.map((a) => (
            <button key={a} type="button" aria-pressed={akses === a} onClick={() => setAkses(a)} className={pil(akses === a)}>
              {LABEL_AKSES[a]}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <span className={label}>Foto</span>
        <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-control border border-dashed border-line-2 bg-panel px-4 text-[15px] font-medium">
          <Camera size={20} strokeWidth={1.75} aria-hidden /> {proses ? "Memproses foto…" : foto ? "Ganti foto" : "Ambil foto"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              void pilihFoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {fotoGalat && (
          <p role="alert" className="mt-2 text-[14px] text-telat-ink">
            Foto tidak dapat diproses. Coba foto lain.
          </p>
        )}
        {foto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Pratinjau foto kunjungan" className="mt-3 max-h-60 w-full rounded-control object-cover" />
        )}
      </div>

      <div>
        <label htmlFor="cat" className={label}>
          Catatan <span className="font-normal text-ink-3">({catatan.length}/500)</span>
        </label>
        <textarea id="cat" rows={3} maxLength={500} value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full rounded-control border border-line-2 bg-panel p-3 text-[15px]" />
      </div>

      <p className="text-[13px] text-ink-3">Lokasi: {pos ? "GPS ponsel" : "titik tengah blok (GPS tidak tersedia)"}</p>

      <div className="flex flex-col gap-2">
        <Button type="submit" varian="aksen" ukuran="lg" disabled={proses}>
          <Check size={20} aria-hidden /> Simpan
        </Button>
        <Button ukuran="lg" onClick={onBatal}>
          Batal
        </Button>
      </div>
    </form>
  );
}
