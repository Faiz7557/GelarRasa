type Fc = GeoJSON.FeatureCollection<GeoJSON.Polygon>;

const cache = new WeakMap<Fc, Map<number, Fc>>();

/** Kecilkan tiap poligon di sekitar centroid (rata-rata titik cincin luar) agar blok bersebelahan menjadi pilar terpisah. Properti dipertahankan. */
export function pilar(fc: Fc, skala = 0.62): Fc {
  const per = cache.get(fc) ?? new Map<number, Fc>();
  cache.set(fc, per);
  const ada = per.get(skala);
  if (ada) return ada;
  const out: Fc = {
    type: "FeatureCollection",
    features: fc.features.map((f) => {
      const luar = f.geometry.coordinates[0];
      const n = Math.max(1, luar.length - 1); // titik terakhir = awal
      let cx = 0;
      let cy = 0;
      for (let i = 0; i < n; i++) {
        cx += luar[i][0];
        cy += luar[i][1];
      }
      cx /= n;
      cy /= n;
      return { ...f, geometry: { type: "Polygon", coordinates: f.geometry.coordinates.map((r) => r.map(([x, y]) => [cx + (x - cx) * skala, cy + (y - cy) * skala])) } };
    }),
  };
  per.set(skala, out);
  return out;
}
