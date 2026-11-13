/** Geometri penampang gambut (koordinat SVG). Skala 1 px per cm, 0–120 cm; lebih dari itu dijepit. */
export const Y_PERMUKAAN = 80;
export const CM_MAKS = 120;
export const Y_DASAR = Y_PERMUKAAN + CM_MAKS;

export type StatusAir = "aman" | "kering" | "belum";

export function peatGeometry(mukaAirCm: number | null, ambangCm = 40) {
  const yAmbang = Y_PERMUKAAN + ambangCm;
  const base = { yPermukaan: Y_PERMUKAAN, yAmbang, yDasar: Y_DASAR };
  if (mukaAirCm == null || !Number.isFinite(mukaAirCm)) {
    return { ...base, yAir: null, status: "belum" as StatusAir, label: "Belum diukur" };
  }
  const cm = Math.max(0, mukaAirCm);
  const status: StatusAir = cm > ambangCm ? "kering" : "aman";
  if (cm > CM_MAKS) return { ...base, yAir: Y_DASAR, status, label: `≥ ${CM_MAKS} cm` };
  return {
    ...base,
    yAir: Y_PERMUKAAN + cm,
    status,
    label: `${cm.toLocaleString("id-ID", { maximumFractionDigits: 1 })} cm`,
  };
}
