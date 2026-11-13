// Tautan WhatsApp (wa.me) untuk menugaskan blok. Murni: tidak mengirim apa pun, hanya membentuk URL.
import { fmtTanggal } from "./format";

export interface WaTugas {
  block_id: number;
  kab: string | null;
  lat: number | null;
  lon: number | null;
  tenggat: string;
  jenisLabel: string;
}

export function buildWaLink(penerima: { nama: string; wa: string }, t: WaTugas, baseUrl: string): string {
  const koordinat = t.lat != null && t.lon != null ? `${t.lat.toFixed(5)}, ${t.lon.toFixed(5)}` : "-";
  const teks = [
    `Halo ${penerima.nama},`,
    `Blok ${t.block_id} · ${t.kab ?? "-"}`,
    `Koordinat: ${koordinat}`,
    `Tugas: ${t.jenisLabel}`,
    `Tenggat: ${fmtTanggal(t.tenggat)}`,
    `Kartu Lokasi: ${baseUrl.replace(/\/$/, "")}/blok/${t.block_id}`,
  ].join("\n");
  return `https://wa.me/${penerima.wa.replace(/\D/g, "")}?text=${encodeURIComponent(teks)}`;
}
