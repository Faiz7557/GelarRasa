export type StatusBlok = "belum" | "sedang" | "siap";
export type KelasPeta = "P1" | "P2" | "CEK" | "PANTAU";

export type BlokPeta = {
  block_id: number;
  kab: string;
  kelas: KelasPeta;
  tipe: number;
  hotspot: number;
  last_year: number;
  full_obs_years: number;
  status: StatusBlok;
};

export type FilterPeta = {
  kelas: KelasPeta[];
  kab: string; // "" = semua
  kurang4: boolean;
  status: StatusBlok[];
};

export const KELAS_PETA: KelasPeta[] = ["P1", "P2", "CEK", "PANTAU"];
export const STATUS_PETA: StatusBlok[] = ["belum", "sedang", "siap"];
export const LABEL_STATUS: Record<StatusBlok, string> = { belum: "Belum", sedang: "Sedang", siap: "Siap" };
export const VARIAN_STATUS = { belum: "netral", sedang: "segera", siap: "siap" } as const;
