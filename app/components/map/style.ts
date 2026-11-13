import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

// Hex sama dengan token docs/07 §4.2 (MapLibre tidak membaca CSS var).
export const C = {
  laut: "#dce3e1",
  daratan: "#e2d6bf",
  provTetangga: "#efe6d6",
  provTetanggaGaris: "#cdbfa8",
  provFokus: "#faf5ec",
  provFokusGaris: "#8c7b66",
  luar: "#e9dfcc",
  gambut: "#e2d6bf",
  kabGaris: "#cdbfa8",
  tipe1: "#8fa3ad",
  tipe2: "#d4943a",
  tipe3: "#a8432a",
  hotspot: "#2c2318",
  ink: "#2c2318",
  telatSoft: "#f4d9cf",
  siapSoft: "#e3ebd9",
} as const;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Menara 3D: 1 lantai = 1 tahun berjejak (properti `t`), tinggi per lantai dalam meter. 1.500 m terlalu rendah pada zoom ~6 (menara < 5 px); 3.000 m terbaca sebagai pegunungan. */
export const M_PER_TAHUN = 3000;
/** Hero 3D: tinggi kabupaten = blok prioritas belum siap x 1.000 m (400 m hanya ~20 px di zoom hero; 1.000 m: Pulang Pisau 79 -> 79 km ~ 55 px, jelas tertinggi, label marker HTML tetap di atas kanvas). */
export const M_PER_BELUM = 1000;
/** Warna tua 15% (hotspot di 3D). */
export const gelap = (h: string, f = 0.15) => "#" + hex(h).map((v) => Math.round(v * (1 - f)).toString(16).padStart(2, "0")).join("");

export type KabStat = { kab_id: string; nama: string; siap: number; wajib: number; pct: number; belum: number };

/** 5 kelas choropleth, interpolasi linear --telat-soft -> --siap-soft. */
export const KELAS_PCT: string[] = Array.from({ length: 5 }, (_, i) => {
  const a = hex(C.telatSoft);
  const b = hex(C.siapSoft);
  return "#" + a.map((v, k) => Math.round(v + ((b[k] - v) * i) / 4).toString(16).padStart(2, "0")).join("");
});
export const kelasPct = (pct: number) => Math.min(4, Math.floor(pct / 20));

const empty = { type: "FeatureCollection", features: [] } as const;
const state = (k: string): ExpressionSpecification => ["feature-state", k];
const aktif = (k: string): ExpressionSpecification => ["==", state(k), true];

const tipeWarna = (a: string, b: string, c: string): ExpressionSpecification => ["match", ["to-number", state("tipe"), 0], 1, a, 2, b, 3, c, C.daratan];

export function buildStyle(mode: "blok" | "kabupaten"): StyleSpecification {
  const kab = mode === "kabupaten";
  return {
    version: 8,
    // Tanpa glyphs/tile eksternal: label berupa marker HTML (BlockMapInner).
    sources: {
      indonesia: { type: "geojson", data: "/geo/indonesia.geojson" },
      provinsi: { type: "geojson", data: "/geo/provinsi.geojson" },
      mask: { type: "geojson", data: empty as never },
      gambut: { type: "geojson", data: "/geo/gambut.geojson" },
      kabupaten: { type: "geojson", data: "/geo/kabupaten.geojson", promoteId: "kab_id" },
      blocks: { type: "geojson", data: "/geo/blocks.geojson", promoteId: "id" },
      // Pilar 3D: diisi BlockMapInner (blocks.geojson dikecilkan per blok) saat view3d pertama aktif.
      "blocks-pilar": { type: "geojson", data: empty as never, promoteId: "id" },
      jendela: { type: "geojson", data: "/geo/jendela.geojson" },
      // Hero 3D: salinan kabupaten + properti belum/kelas (tinggi ekstrusi tak mendukung feature-state); diisi BlockMapInner saat view3d.
      ...(kab ? { "kabupaten-3d": { type: "geojson" as const, data: empty as never, promoteId: "kab_id" } } : {}),
    },
    layers: [
      { id: "laut", type: "background", paint: { "background-color": C.laut } },
      { id: "indonesia-darat", type: "fill", source: "indonesia", paint: { "fill-color": C.daratan } },
      { id: "prov-tetangga", type: "fill", source: "provinsi", filter: ["==", ["get", "fokus"], 0], paint: { "fill-color": C.provTetangga } },
      { id: "prov-tetangga-garis", type: "line", source: "provinsi", filter: ["==", ["get", "fokus"], 0], paint: { "line-color": C.provTetanggaGaris, "line-width": 1 } },
      { id: "prov-fokus", type: "fill", source: "provinsi", filter: ["==", ["get", "fokus"], 1], paint: { "fill-color": C.provFokus } },
      { id: "prov-fokus-garis", type: "line", source: "provinsi", filter: ["==", ["get", "fokus"], 1], paint: { "line-color": C.provFokusGaris, "line-width": 1.5 } },
      { id: "luar-jendela", type: "fill", source: "mask", paint: { "fill-color": "rgba(44,35,24,0.09)" } },
      { id: "gambut", type: "fill", source: "gambut", paint: { "fill-color": C.gambut } },
      {
        id: "kab-isi",
        type: "fill",
        source: "kabupaten",
        paint: {
          "fill-color": kab
            ? ["case", ["==", ["to-number", state("kelas"), -1], -1], "rgba(0,0,0,0)", ["step", ["to-number", state("kelas"), 0], KELAS_PCT[0], 1, KELAS_PCT[1], 2, KELAS_PCT[2], 3, KELAS_PCT[3], 4, KELAS_PCT[4]]]
            : "rgba(0,0,0,0)",
          "fill-opacity": kab ? 0.85 : 1,
        },
      },
      {
        id: "kab-garis",
        type: "line",
        source: "kabupaten",
        paint: { "line-color": kab ? C.provFokusGaris : C.kabGaris, "line-width": ["case", aktif("hover"), 2, 0.8] },
      },
      {
        id: "blok-isi",
        type: "fill",
        source: "blocks",
        paint: {
          "fill-color": ["match", ["to-number", state("tipe"), 0], 1, C.tipe1, 2, C.tipe2, 3, C.tipe3, "rgba(0,0,0,0)"],
          "fill-opacity": ["case", aktif("visible"), kab ? 0.35 : 0.9, 0],
        },
      },
      {
        id: "blok-hotspot",
        type: "line",
        source: "blocks",
        paint: { "line-color": C.hotspot, "line-width": ["case", ["all", aktif("visible"), aktif("hotspot")], kab ? 0.5 : 1.2, 0] },
      },
      { id: "jendela", type: "line", source: "jendela", paint: { "line-color": C.ink, "line-width": 1.2, "line-dasharray": [3, 2] } },
      { id: "blok-sorot", type: "line", source: "blocks", paint: { "line-color": C.ink, "line-width": ["case", aktif("selected"), 2.5, 0] } },
      // Hero 3D (3D-4): kabupaten diekstrusi; tinggi = properti `belum` x M_PER_BELUM. Tersembunyi sampai view3d.
      ...(kab
        ? [
            {
              id: "kab-3d",
              type: "fill-extrusion" as const,
              source: "kabupaten-3d",
              filter: [">", ["get", "belum"], 0] as ExpressionSpecification, // tanpa blok wajib: tidak diekstrusi
              layout: { visibility: "none" as const },
              paint: {
                "fill-extrusion-color": ["case", ["==", ["get", "kelas"], -1], "rgba(0,0,0,0)", ["step", ["get", "kelas"], KELAS_PCT[0], 1, KELAS_PCT[1], 2, KELAS_PCT[2], 3, KELAS_PCT[3], 4, KELAS_PCT[4]]] as ExpressionSpecification,
                "fill-extrusion-height": ["*", ["get", "belum"], M_PER_BELUM] as ExpressionSpecification,
                "fill-extrusion-base": 0,
                "fill-extrusion-opacity": 0.92,
                "fill-extrusion-vertical-gradient": true,
              },
            },
          ]
        : []),
      // Menara pengulangan (3D-1): tersembunyi sampai view3d; visibilitas diatur BlockMapInner.
      ...(kab
        ? []
        : [
            {
              id: "blocks-3d",
              type: "fill-extrusion" as const,
              source: "blocks-pilar",
              filter: [">", ["get", "t"], 0] as ExpressionSpecification,
              layout: { visibility: "none" as const },
              paint: {
                "fill-extrusion-color": ["case", aktif("selected"), C.ink, aktif("hotspot"), tipeWarna(gelap(C.tipe1), gelap(C.tipe2), gelap(C.tipe3)), tipeWarna(C.tipe1, C.tipe2, C.tipe3)] as ExpressionSpecification,
                "fill-extrusion-height": ["*", ["get", "t"], M_PER_TAHUN] as ExpressionSpecification,
                "fill-extrusion-base": 0,
                "fill-extrusion-opacity": 1,
                "fill-extrusion-vertical-gradient": true,
              },
            },
          ]),
    ],
  };
}
