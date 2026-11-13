// Antrean kunjungan di ponsel (localStorage). Klien saja. docs/02 §9.
export const KUNCI_ANTRE = "tabat:lapangan:antre";
export const KUNCI_LURING = "tabat:lapangan:luring";
const EVT = "tabat:antre";

export interface Payload {
  client_id: string;
  block_id: number;
  jenis: "periksa" | "rawat";
  tanggal: string;
  muka_air_cm: number | null;
  tabat_id: string | null;
  kondisi_tabat: string | null;
  akses_aktual: string | null;
  foto: string | null;
  catatan: string | null;
  tugas_id: string | null;
  lon: number | null;
  lat: number | null;
  koordinat_sumber: "gps" | "centroid";
}
export interface ItemAntre {
  payload: Payload;
  status: "antre" | "gagal";
  pesan?: string;
}

function baca(): ItemAntre[] {
  try {
    const a = JSON.parse(localStorage.getItem(KUNCI_ANTRE) ?? "[]");
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}
function tulis(a: ItemAntre[]): boolean {
  try {
    localStorage.setItem(KUNCI_ANTRE, JSON.stringify(a));
  } catch {
    return false;
  }
  window.dispatchEvent(new Event(EVT));
  return true;
}

export const daftarAntre = baca;
export function tambah(p: Omit<Payload, "client_id">): boolean {
  return tulis([...baca(), { payload: { ...p, client_id: crypto.randomUUID() }, status: "antre" }]);
}
export function hapus(clientId: string) {
  tulis(baca().filter((i) => i.payload.client_id !== clientId));
}
export function ubahAntre(fn: () => void): () => void {
  window.addEventListener(EVT, fn);
  window.addEventListener("storage", fn);
  return () => {
    window.removeEventListener(EVT, fn);
    window.removeEventListener("storage", fn);
  };
}

export function modeLuring(): boolean {
  try {
    return localStorage.getItem(KUNCI_LURING) === "1";
  } catch {
    return false;
  }
}
export function setModeLuring(v: boolean) {
  try {
    localStorage.setItem(KUNCI_LURING, v ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event(EVT));
}
export const luring = () => modeLuring() || !navigator.onLine;

let jalan = false;
/** Kirim satu per satu. Kembalikan jumlah yang terkirim. 2xx hapus; 4xx (kecuali 401) gagal permanen; sisanya coba lagi nanti. */
export async function kirimAntre(): Promise<number> {
  if (jalan || luring()) return 0;
  jalan = true;
  let terkirim = 0;
  try {
    for (const it of baca()) {
      if (it.status === "gagal") continue;
      if (luring()) break;
      let r: Response;
      try {
        r = await fetch("/api/kunjungan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(it.payload) });
      } catch {
        break;
      }
      if (r.status === 200 || r.status === 201) {
        hapus(it.payload.client_id);
        terkirim++;
      } else if (r.status === 401 || r.status >= 500) {
        break;
      } else {
        const j = await r.json().catch(() => null);
        tulis(baca().map((x) => (x.payload.client_id === it.payload.client_id ? { ...x, status: "gagal", pesan: j?.error ?? `Ditolak server (${r.status}).` } : x)));
      }
    }
  } finally {
    jalan = false;
  }
  return terkirim;
}
