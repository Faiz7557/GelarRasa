// Murni (aman klien + server): sortir teks bebas alasan tolak ke satu alasan baku.
import { ALASAN, type Alasan } from "./copy";

export const ALASAN_TOLAK = ALASAN;
export type { Alasan };

const POLA: [Exclude<Alasan, "lainnya">, RegExp][] = [
  ["akses_terputus", /akses|jalan|jembatan|putus|banjir|tergenang|tidak bisa (di)?(capai|lewat)|longsor|sungai surut|perahu/i],
  ["sudah_dibasahi", /sudah (di)?basah|dibasahi|terendam|muka air (sudah )?(naik|tinggi)|sekat sudah menahan air/i],
  ["bukan_gambut", /bukan gambut|tanah mineral|pasir|data (peta )?salah/i],
  ["di_luar_kewenangan", /kewenangan|konsesi|izin|perusahaan|hgu|kawasan hutan negara|bukan wilayah/i],
  ["tabat_sudah_baik", /tabat (masih |sudah )?baik|sekat (masih |sudah )?bagus|baru diperbaiki/i],
];

export function sortirKataKunci(teks: string): { alasan: Alasan; cocok: string | null } {
  for (const [alasan, re] of POLA) {
    const m = re.exec(teks);
    if (m) return { alasan, cocok: m[0] };
  }
  return { alasan: "lainnya", cocok: null };
}

/** Titik sambung T60: bungkus dengan AI, lalu jatuh ke sini bila gagal. */
export async function sortirAlasan(teks: string): Promise<{ alasan: Alasan; sumber: "kata_kunci" | "ai" }> {
  return { alasan: sortirKataKunci(teks).alasan, sumber: "kata_kunci" };
}
