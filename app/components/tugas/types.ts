import type { StatusTugas } from "@/lib/rules";

export interface TugasKartu {
  tugas_id: string;
  block_id: number;
  jenis: string;
  status: StatusTugas;
  pemilik: string | null;
  tenggat: string;
  alasan_tolak: string | null;
  catatan_tolak: string | null;
  is_demo: number;
  kab_id: string | null;
  kab: string | null;
  kelas: string | null;
  lon: number | null;
  lat: number | null;
  has_foto_visit: boolean;
  terlambat: boolean;
  mingguIni: boolean;
  /** tenggat bawaan dari akses blok (untuk dialog Setujui) */
  tenggatBawaan: string;
}

export interface Bukti {
  foto: string;
  tanggal: string;
  muka_air_cm: number | null;
  kondisi_tabat: string | null;
}

export const LABEL_JENIS: Record<string, string> = {
  periksa: "Periksa",
  rawat_tabat: "Rawat tabat",
  basahi: "Basahi gambut",
  verifikasi: "Verifikasi",
};
