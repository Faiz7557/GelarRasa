"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { buildStyle } from "@/components/map/style";
import { WARNA } from "./colors";
import { IndonesiaInset } from "@/components/map/IndonesiaInset";
import { pilar } from "@/components/map/pillars";
import { BIT } from "./bits";
import { ABU_LAPIS, ABU_LAPIS_2, ANGKAT_2023, CARAMEL, CLAY, IDX_2023, JARAK_LAPIS, N_TAHUN, TEBAL_LAPIS, filterTahun, idLapis } from "./stack";

const PITCH_3D = 50;
const BEARING_3D = -25;
/** Kantong berulang terpadat (selatan Kalteng): di zoom seluruh jendela, blok 2,3 km hanya ±2 px sehingga lapis tak terbaca. */
const PUSAT_3D: [number, number] = [113.9, -3.15];
const ZOOM_3D = 9.5;



/** Peta Putar Ulang: source blocks dari buildStyle, warna per langkah lewat feature-state `w` (1 abu, 2 oranye, 3 merah) dan `tepat`. */
export default function ReplayMap({ blok, langkah, view3d = true, kurangGerak = false }: { blok: [number, number][]; langkah: 1 | 2 | 3; view3d?: boolean; kurangGerak?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [siap, setSiap] = useState(false);
  const [pilarOk, setPilarOk] = useState(false);
  const boundsRef = useRef<maplibregl.LngLatBoundsLike | null>(null);
  const awal = useRef({ view3d, kurangGerak });

  useEffect(() => {
    if (!boxRef.current) return;
    const map = new maplibregl.Map({
      container: boxRef.current,
      style: buildStyle("blok"),
      bounds: [[113.8, -4.1], [117.2, -1.9]],
      attributionControl: { customAttribution: "MODIS MCD64A1 · BIG · GADM 4.1" },
      dragRotate: false,
      maxPitch: 60,
    });
    mapRef.current = map;
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.getCanvas().setAttribute("aria-label", "Peta jendela studi: blok berjejak 2015–2022, blok prioritas, dan jejak 2023");
    map.on("load", () => {
      // Tumpukan memakai tapak blok yang dikecilkan (pilar) agar kolom bersebelahan tidak menyatu.
      fetch("/geo/blocks.geojson")
        .then((r) => r.json())
        .then((j: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
          (map.getSource("blocks-pilar") as maplibregl.GeoJSONSource | undefined)?.setData(pilar(j));
          setPilarOk(true);
        })
        .catch(() => {});
      map.addLayer({ id: "rp-isi", type: "fill", source: "blocks", paint: { "fill-color": ["match", ["to-number", ["feature-state", "w"], 0], 1, WARNA.abu, 2, WARNA.oranye, 3, WARNA.merah, "rgba(0,0,0,0)"], "fill-opacity": 0.85 } }, "jendela");
      map.addLayer({ id: "rp-tepi", type: "line", source: "blocks", paint: { "line-color": WARNA.oranye, "line-width": ["case", ["==", ["feature-state", "tepat"], true], 1.6, 0] } }, "jendela");
      // Tumpukan tahun: 10 lapis fill-extrusion, filter bit `y`; 2015–2022 abu (Caramel bila blok prioritas), 2023 Clay.
      for (let i = 0; i < N_TAHUN; i++) {
        const id = idLapis(i);
        const t2023 = i === IDX_2023;
        const dasar = i * JARAK_LAPIS + (t2023 ? ANGKAT_2023 : 0);
        map.addLayer({
          id,
          type: "fill-extrusion",
          source: "blocks-pilar",
          filter: filterTahun(i),
          layout: { visibility: awal.current.view3d && i !== N_TAHUN - 1 ? "visible" : "none" },
          paint: {
            "fill-extrusion-color": t2023 ? CLAY : ["case", ["==", ["feature-state", "pri"], true], i % 2 ? "#BC8230" : CARAMEL, i % 2 ? ABU_LAPIS_2 : ABU_LAPIS],
            "fill-extrusion-base": dasar,
            "fill-extrusion-height": dasar + TEBAL_LAPIS,
            "fill-extrusion-opacity": t2023 ? 0 : 1,
            "fill-extrusion-vertical-gradient": true,
          },
        }, "jendela");
      }
      map.setLight({ anchor: "map", position: [1.4, 215, 35], color: "#fff4e0", intensity: 0.55 });
      fetch("/geo/jendela.geojson")
        .then((r) => r.json())
        .then((j: GeoJSON.FeatureCollection<GeoJSON.Polygon>) => {
          const ring = j.features[0].geometry.coordinates[0];
          const xs = ring.map((p) => p[0]);
          const ys = ring.map((p) => p[1]);
          (map.getSource("mask") as maplibregl.GeoJSONSource).setData({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[[100, -12], [125, -12], [125, 8], [100, 8], [100, -12]], ring] } });
          const b: maplibregl.LngLatBoundsLike = [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
          boundsRef.current = b;
          if (awal.current.view3d) map.jumpTo({ center: PUSAT_3D, zoom: ZOOM_3D, pitch: PITCH_3D, bearing: BEARING_3D });
          else map.fitBounds(b, { padding: 16, duration: 0 });
        })
        .catch(() => {});
      setSiap(true);
    });
    return () => {
      map.remove();
      mapRef.current = null;
      setSiap(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!siap || !map) return;
    for (const [id, bit] of blok) {
      const berjejak = !!(bit & BIT.BERJEJAK);
      const pri = !!(bit & BIT.PRIORITAS);
      const jatuh = !!(bit & BIT.JEJAK_2023);
      let w = 0;
      if (langkah === 3 && jatuh) w = 3;
      else if (langkah >= 2 && pri) w = 2;
      else if (berjejak) w = 1;
      const st = { w, tepat: langkah === 3 && jatuh && pri, pri: langkah >= 2 && pri };
      map.setFeatureState({ source: "blocks", id }, st);
      if (pilarOk) map.setFeatureState({ source: "blocks-pilar", id }, st);
    }
  }, [siap, blok, langkah, pilarOk]);

  // Sakelar 3D/2D: tampilkan lapis atau peta lama; kamera miring hanya di 3D.
  useEffect(() => {
    const map = mapRef.current;
    if (!siap || !map) return;
    for (let i = 0; i < N_TAHUN; i++) map.setLayoutProperty(idLapis(i), "visibility", view3d && i !== N_TAHUN - 1 ? "visible" : "none");
    map.setLayoutProperty("rp-isi", "visibility", view3d ? "none" : "visible");
    map.setLayoutProperty("rp-tepi", "visibility", view3d ? "none" : "visible");
    const duration = kurangGerak ? 0 : 700;
    if (view3d) map.easeTo({ center: PUSAT_3D, zoom: ZOOM_3D, pitch: PITCH_3D, bearing: BEARING_3D, duration });
    else if (boundsRef.current) map.fitBounds(boundsRef.current, { padding: 16, duration, pitch: 0, bearing: 0 });
    else map.easeTo({ pitch: 0, bearing: 0, duration });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siap, view3d]);

  // Langkah 3: lapis 2023 jatuh ke posisinya (tanpa animasi bila gerak dikurangi).
  useEffect(() => {
    const map = mapRef.current;
    if (!siap || !map) return;
    const id = idLapis(IDX_2023);
    const dur = kurangGerak ? 0 : 900;
    for (const k of ["fill-extrusion-opacity", "fill-extrusion-base", "fill-extrusion-height"]) map.setPaintProperty(id, `${k}-transition`, { duration: dur, delay: 0 });
    const dasar = IDX_2023 * JARAK_LAPIS + (langkah === 3 ? 0 : ANGKAT_2023);
    map.setPaintProperty(id, "fill-extrusion-opacity", langkah === 3 ? 1 : 0);
    map.setPaintProperty(id, "fill-extrusion-base", dasar);
    map.setPaintProperty(id, "fill-extrusion-height", dasar + TEBAL_LAPIS);
  }, [siap, langkah, kurangGerak]);

  return (
    <div className="absolute inset-0">
      <div ref={boxRef} className="h-full w-full" />
      <IndonesiaInset className="pointer-events-none absolute bottom-3 left-3 h-[70px] w-[180px]" />
    </div>
  );
}
