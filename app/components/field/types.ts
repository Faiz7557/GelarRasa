export interface TugasLap {
  tugas_id: string;
  block_id: number;
  jenis: string;
  status: string;
  pemilik: string | null;
  tenggat: string;
  kab: string | null;
  lon: number | null;
  lat: number | null;
  terlambat: boolean;
}
export interface TabatLap {
  tabat_id: string;
  bahan: string | null;
  kondisi_awal: string | null;
}
export const LABEL_JENIS_TUGAS: Record<string, string> = {
  periksa: "Periksa",
  rawat_tabat: "Rawat tabat",
  basahi: "Basahi gambut",
  verifikasi: "Verifikasi",
};
