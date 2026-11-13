"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Globe2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtNum, fmtPct } from "@/lib/format";
import { ErrorCard } from "@/components/ui/ErrorCard";
import { IndonesiaInset } from "./IndonesiaInset";
import { MapFallbackList } from "./MapFallbackList";
import { pilar } from "./pillars";
import { buildStyle, kelasPct, type KabStat } from "./style";
import { useBlockAttrs, type BlokAttrs } from "./useBlockAttrs";

export type BlockMapProps = {
  filter?: { kelas?: string[]; kab?: string | null; ids?: Set<number> | number[] };
  highlightId?: number | null;
  /** [lon, lat]: peta dibuka dekat titik ini (peta mini Kartu Lokasi), bukan seluruh Kalteng–Kalsel. */
  focus?: [number, number] | null;
  onBlockClick?: (id: number) => void;
  mode?: "blok" | "kabupaten";
  kabStats?: KabStat[];
  onKabClick?: (kabId: string) => void;
  className?: string;
  height?: number | string;
  /** Data /api/blok-atribut bila halaman sudah punya (tanpa fetch ulang). */
  attrs?: BlokAttrs;
  /** Inset siluet Indonesia di pojok kiri-bawah (default true). */
  inset?: boolean;
  /** 3D: mode "blok" = menara pengulangan (1 lantai = 1 tahun berjejak); mode "kabupaten" = tinggi menurut blok belum siap. */
  view3d?: boolean;
};

type Fc = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, Record<string, unknown>>;
type Bounds = [[number, number], [number, number]];
type Label = { el: HTMLDivElement; marker: maplibregl.Marker; kind: "prov" | "kab"; id: string; nama: string; fokus: boolean };

const AWAL: Bounds = [[110.0, -4.4], [116.8, 0.3]]; // Kalteng–Kalsel (dikoreksi dari provinsi.geojson setelah dimuat)
const JENDELA_CADANGAN: Bounds = [[113.8, -4.1], [117.2, -1.9]];
/** Sebaran blok berjejak di selatan Kalteng: bingkai awal tampilan 3D. */
const BLOK3D: Bounds = [[111.3, -4.0], [116.3, -2.0]];
const PITCH_KAB = 50;
const INDONESIA: Bounds = [[95, -11], [141, 6.1]];
const SUMBER = "MODIS MCD64A1 · BIG · GADM 4.1";

const webglAda = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

const rings = (g: GeoJSON.Polygon | GeoJSON.MultiPolygon) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
function bboxOf(pts: number[][]): Bounds {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of pts) [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
  return [[x0, y0], [x1, y1]];
}
/** Titik label = pusat bbox poligon terbesar (cukup untuk label; bukan centroid sungguhan). */
function titikLabel(g: GeoJSON.Polygon | GeoJSON.MultiPolygon): [number, number] {
  let best: Bounds | null = null;
  let luas = -1;
  for (const p of rings(g)) {
    const b = bboxOf(p[0]);
    const a = (b[1][0] - b[0][0]) * (b[1][1] - b[0][1]);
    if (a > luas) [best, luas] = [b, a];
  }
  const b = best as Bounds;
  return [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2];
}

const tombol = "flex items-center gap-2 rounded-control border border-line-2 bg-panel px-3 py-2 text-[13px] font-medium text-ink hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-ink";

export default function BlockMapInner({ filter, highlightId = null, focus = null, onBlockClick, mode = "blok", kabStats, onKabClick, className, height = 560, attrs: attrsProp, inset = true, view3d = false }: BlockMapProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const labelsRef = useRef<Label[]>([]);
  const jendelaRef = useRef<Bounds>(JENDELA_CADANGAN);
  const hiddenRef = useRef<Set<number>>(new Set());
  const sorotRef = useRef<number | null>(null);
  const view3dRef = useRef(view3d);
  const pilarRef = useRef(false);
  const camRef = useRef<{ center: maplibregl.LngLat; zoom: number } | null>(null);
  const cb = useRef({ onBlockClick, onKabClick, mode, kabStats });
  const [webgl] = useState(webglAda);
  const [gagal, setGagal] = useState(false);
  const [siap, setSiap] = useState(false);
  const focusRef = useRef(focus);
  const [tip, setTip] = useState<{ x: number; y: number; teks: string } | null>(null);
  const { attrs, galat, ulang } = useBlockAttrs(attrsProp);
  const [kabIds, setKabIds] = useState<{ kab: string; ids: Set<number> } | null>(null);

  useEffect(() => {
    cb.current = { onBlockClick, onKabClick, mode, kabStats };
    view3dRef.current = view3d;
  });

  const segarkanLabel = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const { mode: m, kabStats: ks } = cb.current;
    const z = map.getZoom();
    const stat = new Map((ks ?? []).map((k) => [k.kab_id, k]));
    const prio = new Map<HTMLDivElement, number>();
    for (const l of labelsRef.current) {
      let teks = l.nama;
      let tampil: boolean;
      if (l.kind === "prov") tampil = m === "blok" && z < 7;
      else if (m === "kabupaten") {
        const k = stat.get(l.id);
        tampil = l.fokus && !!k && k.wajib > 0;
        if (k) teks = `${l.nama} · ${fmtNum(k.belum)} belum siap`;
      } else tampil = l.fokus && z >= 7;
      l.el.textContent = teks;
      l.el.style.display = tampil ? "" : "none";
      if (tampil) prio.set(l.el, stat.get(l.id)?.belum ?? (l.fokus ? 1 : 0));
    }
    // Label yang bertabrakan disembunyikan; yang paling banyak "belum siap" didahulukan.
    const dipakai: DOMRect[] = [];
    for (const [el] of [...prio].sort((x, y) => y[1] - x[1])) {
      const r = el.getBoundingClientRect();
      const tabrak = dipakai.some((d) => r.left < d.right + 4 && r.right > d.left - 4 && r.top < d.bottom + 2 && r.bottom > d.top - 2);
      if (tabrak) el.style.display = "none";
      else dipakai.push(r);
    }
  }, []);

  // Inisialisasi peta (sekali per mode).
  useEffect(() => {
    if (!webgl || !boxRef.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: boxRef.current,
        style: buildStyle(mode),
        bounds: AWAL,
        fitBoundsOptions: { padding: 16 },
        attributionControl: { customAttribution: SUMBER },
        dragRotate: false,
        pitchWithRotate: false,
        locale: { "NavigationControl.ZoomIn": "Perbesar peta", "NavigationControl.ZoomOut": "Perkecil peta" },
      });
    } catch {
      queueMicrotask(() => setGagal(true));
      return;
    }
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.getCanvas().setAttribute("aria-label", "Peta lahan gambut Kalimantan Tengah dan Kalimantan Selatan: blok menurut riwayat pengulangan jejak, hotspot, dan jendela studi");
    map.on("error", (e) => {
      if (/webgl/i.test(String(e.error?.message))) setGagal(true);
    });

    // Blok yang terlihat di titik: 3D = menara terdepan (filter lapisan sudah menyaring); 2D = blok-isi tak tersembunyi.
    const blokDi = (pt: maplibregl.Point) =>
      view3dRef.current
        ? map.queryRenderedFeatures(pt, { layers: ["blocks-3d"] })[0]
        : map.queryRenderedFeatures(pt, { layers: ["blok-isi"] }).find((x) => !hiddenRef.current.has(Number(x.id)));
    let hover: string | null = null;
    const kabState = (id: string, hover: boolean) => map.setFeatureState({ source: "kabupaten", id }, { hover });
    map.on("mousemove", (e) => {
      const kab = cb.current.mode === "kabupaten";
      const f = kab
        ? map.queryRenderedFeatures(e.point, { layers: view3dRef.current ? ["kab-3d", "kab-isi"] : ["kab-isi"] })[0]
        : blokDi(e.point);
      map.getCanvas().style.cursor = f ? "pointer" : "";
      const id = kab && f ? String(f.id) : null;
      if (id !== hover) {
        if (hover) kabState(hover, false);
        if (id) kabState(id, true);
        hover = id;
      }
      const k = id ? cb.current.kabStats?.find((x) => x.kab_id === id) : undefined;
      const nama = f ? String(f.properties?.nama ?? "") : "";
      setTip(id && nama ? { x: e.point.x, y: e.point.y, teks: k ? `${nama} · ${fmtPct(k.pct)} siap · ${fmtNum(k.belum)} belum siap` : nama } : null);
    });
    map.on("mouseout", () => setTip(null));
    map.on("click", (e) => {
      if (cb.current.mode === "kabupaten") {
        const f = map.queryRenderedFeatures(e.point, { layers: view3dRef.current ? ["kab-3d", "kab-isi"] : ["kab-isi"] })[0];
        if (f) cb.current.onKabClick?.(String(f.id));
        return;
      }
      const f = blokDi(e.point);
      if (f) cb.current.onBlockClick?.(Number(f.id));
    });

    map.on("zoom", segarkanLabel);
    map.on("zoomend", segarkanLabel);
    map.on("load", () => {
      setSiap(true);
      // Topeng "di luar jendela" = kotak besar berlubang jendela; label dari provinsi/kabupaten.
      fetch("/geo/jendela.geojson")
        .then((r) => r.json())
        .then((j: Fc) => {
          const ring = (j.features[0].geometry as GeoJSON.Polygon).coordinates[0];
          jendelaRef.current = bboxOf(ring);
          (map.getSource("mask") as maplibregl.GeoJSONSource | undefined)?.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [[[80, -25], [160, -25], [160, 20], [80, 20], [80, -25]], ring] },
          });
        })
        .catch(() => {});
      Promise.all([fetch("/geo/provinsi.geojson").then((r) => r.json()), fetch("/geo/kabupaten.geojson").then((r) => r.json())])
        .then(([p, k]: [Fc, Fc]) => {
          const fokus = p.features.filter((f) => f.properties.fokus === 1);
          if (!focusRef.current) {
            const v3 = view3dRef.current;
            map.fitBounds(v3 && mode === "blok" ? BLOK3D : bboxOf(fokus.flatMap((f) => rings(f.geometry).flatMap((r) => r[0]))), { padding: 16, duration: 0, pitch: v3 ? (mode === "blok" ? 55 : PITCH_KAB) : 0, bearing: v3 ? -15 : 0 });
          }
          const mk = (kind: Label["kind"], f: Fc["features"][number], id: string) => {
            const el = document.createElement("div");
            el.className = "pointer-events-none whitespace-nowrap font-sans text-[12px] leading-4 text-ink-3 [text-shadow:0_0_3px_#fff,0_0_3px_#fff,0_0_2px_#fff]";
            const marker = new maplibregl.Marker({ element: el }).setLngLat(titikLabel(f.geometry)).addTo(map);
            labelsRef.current.push({ el, marker, kind, id, nama: String(f.properties.nama), fokus: f.properties.fokus === 1 });
          };
          p.features.forEach((f) => mk("prov", f, String(f.properties.nama)));
          k.features.forEach((f) => mk("kab", f, String(f.properties.kab_id)));
          segarkanLabel();
        })
        .catch(() => {});
    });

    const labels = labelsRef.current;
    return () => {
      labels.forEach((l) => l.marker.remove());
      labels.length = 0;
      pilarRef.current = false;
      map.remove();
      mapRef.current = null;
      setSiap(false);
    };
  }, [webgl, mode, segarkanLabel]);

  useEffect(() => {
    segarkanLabel();
  }, [kabStats, siap, mode, segarkanLabel]);

  // Choropleth kabupaten: kelas 0–4 lewat feature-state.
  useEffect(() => {
    const map = mapRef.current;
    if (!siap || !map || mode !== "kabupaten") return;
    for (const k of kabStats ?? []) map.setFeatureState({ source: "kabupaten", id: k.kab_id }, { kelas: k.wajib > 0 ? kelasPct(k.pct) : -1 });
  }, [siap, mode, kabStats]);

  // Hero 3D: kabupaten dengan properti belum/kelas -> sumber "kabupaten-3d" (diambil hanya saat 3D pertama kali aktif).
  const kabGeoRef = useRef<Fc | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!siap || !map || mode !== "kabupaten" || !view3d || !kabStats) return;
    let batal = false;
    const isi = (g: Fc) => {
      const st = new Map(kabStats.map((k) => [k.kab_id, k]));
      (map.getSource("kabupaten-3d") as maplibregl.GeoJSONSource | undefined)?.setData({
        ...g,
        features: g.features.map((f) => {
          const k = st.get(String(f.properties.kab_id));
          return { ...f, properties: { ...f.properties, belum: k && k.wajib > 0 ? k.belum : 0, kelas: k && k.wajib > 0 ? kelasPct(k.pct) : -1 } };
        }),
      });
    };
    if (kabGeoRef.current) isi(kabGeoRef.current);
    else
      fetch("/geo/kabupaten.geojson")
        .then((r) => r.json())
        .then((g: Fc) => {
          kabGeoRef.current = g;
          if (!batal) isi(g);
        })
        .catch(() => {});
    return () => {
      batal = true;
    };
  }, [siap, mode, view3d, kabStats]);

  // Filter kabupaten untuk blok: peta blok->kabupaten tidak ada di atribut, ambil dari /api/blok.
  const kabFilter = filter?.kab ?? null;
  useEffect(() => {
    if (!kabFilter) return;
    let batal = false;
    // ponytail: batas API 2000 blok per kabupaten; pakai filter.ids untuk daftar lebih besar.
    fetch(`/api/blok?kab=${encodeURIComponent(kabFilter)}&limit=2000`)
      .then((r) => r.json())
      .then((j) => !batal && setKabIds({ kab: kabFilter, ids: new Set((j.data as { block_id: number }[]).map((b) => b.block_id)) }))
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [kabFilter]);

  // Atribut + visibilitas blok lewat feature-state (source tidak dibangun ulang).
  const kelasKey = filter?.kelas?.join(",") ?? "";
  const idsFilter = filter?.ids;
  useEffect(() => {
    const map = mapRef.current;
    if (!siap || !map || !attrs) return;
    const kelasSet = kelasKey ? new Set(kelasKey.split(",")) : null;
    const idSet = idsFilter ? (idsFilter instanceof Set ? idsFilter : new Set(idsFilter)) : null;
    const kabSet = kabFilter && kabIds?.kab === kabFilter ? kabIds.ids : null;
    const hidden = new Set<number>();
    for (const [id, k, tipe, hotspot, st] of attrs.baris) {
      const visible = (!kelasSet || kelasSet.has(attrs.kelas[k])) && (!idSet || idSet.has(id)) && (!kabSet || kabSet.has(id));
      if (!visible) hidden.add(id);
      const st3 = { tipe, hotspot: hotspot === 1, kelas: attrs.kelas[k], status: attrs.status[st], visible };
      map.setFeatureState({ source: "blocks", id }, st3);
      map.setFeatureState({ source: "blocks-pilar", id }, st3);
    }
    hiddenRef.current = hidden;
    // Menara 3D mengikuti filter yang sama (opasitas ekstrusi tak mendukung feature-state -> filter properti).
    if (map.getLayer("blocks-3d")) {
      const nTampil = attrs.baris.length - hidden.size;
      const idClause: unknown[] | null = hidden.size === 0 ? null : hidden.size < nTampil ? ["!", ["in", ["get", "id"], ["literal", [...hidden]]]] : ["in", ["get", "id"], ["literal", attrs.baris.map((b) => b[0]).filter((id) => !hidden.has(id))]];
      map.setFilter("blocks-3d", (idClause ? ["all", [">", ["get", "t"], 0], idClause] : [">", ["get", "t"], 0]) as maplibregl.FilterSpecification);
    }
  }, [siap, attrs, kelasKey, idsFilter, kabFilter, kabIds]);

  useEffect(() => {
    const map = mapRef.current;
    if (!siap || !map) return;
    for (const source of ["blocks", "blocks-pilar"]) {
      if (sorotRef.current != null) map.setFeatureState({ source, id: sorotRef.current }, { selected: false });
      if (highlightId != null) map.setFeatureState({ source, id: highlightId }, { selected: true });
    }
    sorotRef.current = highlightId;
  }, [siap, highlightId]);

  // Beralih 2D <-> 3D: tampilkan menara, sembunyikan isi 2D, miringkan kamera (instan bila reduced motion).
  useEffect(() => {
    const map = mapRef.current;
    const kabMode = mode === "kabupaten";
    const lapis = kabMode ? "kab-3d" : "blocks-3d";
    if (!siap || !map || !map.getLayer(lapis)) return;
    const v = (b: boolean) => (b ? "visible" : "none");
    map.setLayoutProperty(lapis, "visibility", v(view3d));
    if (!kabMode) {
      map.setLayoutProperty("blok-isi", "visibility", v(!view3d));
      map.setLayoutProperty("blok-hotspot", "visibility", v(!view3d));
    }
    if (view3d && !kabMode && !pilarRef.current) {
      pilarRef.current = true;
      fetch("/geo/blocks.geojson")
        .then((r) => r.json())
        .then((j: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => (map.getSource("blocks-pilar") as maplibregl.GeoJSONSource | undefined)?.setData(pilar(j)))
        .catch(() => (pilarRef.current = false));
    }
    if (view3d) map.setLight({ anchor: "map", position: [1.5, 315, 45], color: "#fff4e0", intensity: 0.4 }); // dari barat laut
    if (!view3d && map.getPitch() === 0) return;
    const diam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Masuk 3D: bingkai ke sebaran blok; keluar: kembali ke kamera sebelum 3D.
    if (view3d) {
      camRef.current = { center: map.getCenter(), zoom: map.getZoom() };
      const c = kabMode ? null : map.cameraForBounds(BLOK3D, { padding: 16 });
      map.easeTo({ ...(c ? { center: c.center, zoom: c.zoom } : {}), pitch: kabMode ? PITCH_KAB : 55, bearing: -15, duration: diam ? 0 : 900 });
    } else map.easeTo({ ...(camRef.current ?? {}), pitch: 0, bearing: 0, duration: diam ? 0 : 900 });
  }, [siap, mode, view3d]);

  const fLon = focus?.[0];
  const fLat = focus?.[1];
  useEffect(() => {
    focusRef.current = fLon != null && fLat != null ? [fLon, fLat] : null;
    if (siap && fLon != null && fLat != null) mapRef.current?.jumpTo({ center: [fLon, fLat], zoom: 11 });
  }, [siap, fLon, fLat]);

  if (!webgl || gagal) return <MapFallbackList mode={mode} kabStats={kabStats} kelas={filter?.kelas} onBlockClick={onBlockClick} onKabClick={onKabClick} />;

  return (
    <div className={cn("relative overflow-hidden rounded-card border border-line", className)} style={{ height }}>
      <div ref={boxRef} style={{ position: "absolute", inset: 0 }} />
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
        <button
          type="button"
          aria-label="Kembali ke jendela studi"
          onClick={() => mapRef.current?.fitBounds(jendelaRef.current, { padding: 24, pitch: mapRef.current.getPitch(), bearing: mapRef.current.getBearing() })}
          className={tombol}
        >
          <Maximize2 size={16} strokeWidth={1.75} aria-hidden />
          Kembali ke jendela studi
        </button>
        <button type="button" onClick={() => mapRef.current?.fitBounds(INDONESIA, { padding: 16, pitch: mapRef.current.getPitch(), bearing: mapRef.current.getBearing() })} className={tombol}>
          <Globe2 size={16} strokeWidth={1.75} aria-hidden />
          Lihat Indonesia
        </button>
      </div>
      {inset && <IndonesiaInset className="pointer-events-none absolute bottom-7 left-3 z-10 h-[70px] w-[180px] rounded-control border border-line bg-panel/85 p-1" />}
      {tip && (
        <div role="tooltip" className="pointer-events-none absolute z-10 rounded-control border border-line bg-panel px-2 py-1 text-[13px] text-ink shadow-[0_8px_24px_rgb(0_0_0/.08)]" style={{ left: tip.x + 12, top: tip.y + 12 }}>
          {tip.teks}
        </div>
      )}
      {galat && <ErrorCard className="absolute inset-x-3 bottom-8 z-10" pesan="Atribut blok belum termuat." onRetry={ulang} />}
    </div>
  );
}
