// Uji kontras token (WCAG). Membaca :root di app/globals.css. Keluar 1 bila ada pasangan < 4,5:1.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../app/globals.css"), "utf8");
const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
const T = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));
const lum = (h) => {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const rasio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const hexOf = (k) => (k.startsWith("#") ? k : T[k]);
const pasang = [];
const uji = (teks, latar, ket) => pasang.push([teks, latar, ket]);

for (const t of ["ink", "ink-2", "ink-3"]) for (const l of ["ground", "panel", "panel-2"]) uji(t, l, "teks isi");
for (const s of ["telat", "segera", "siap"]) uji(`${s}-ink`, `${s}-soft`, "lencana status");
uji("telat", "panel", "teks status telat");
uji("ground", "ink", "teks header/sidebar");
uji("on-dark-2", "ink", "teks sekunder sidebar");
uji("sorot", "ink", "Caramel di Weathervane (cincin fokus, garis pita)");
uji("ink", "sorot", "item aktif sidebar");
uji("#FAF5EC", "aksen", "tombol primer");
uji("ink", "ground", "lencana DEMO (transparan di Grow)");
uji("ink", "panel", "lencana DEMO di kartu");
uji("#FFFFFF", "siap", "tombol WhatsApp");
uji("#FFFFFF", "telat-ink", "toast galat");
uji("#FFFFFF", "ink", "tombol ink");
uji("aksen", "ground", "tautan aktif");

let gagal = 0;
console.log("teks / latar".padEnd(30), "rasio  ket");
for (const [t, l, ket] of pasang) {
  const r = rasio(hexOf(t), hexOf(l));
  const ok = r >= 4.5;
  if (!ok) gagal++;
  console.log(`${t} / ${l}`.padEnd(30), r.toFixed(2).padStart(5), ok ? "OK  " : "GAGAL", ket);
}
console.log(gagal ? `\n${gagal} pasangan < 4,5:1` : "\nSemua pasangan >= 4,5:1");
process.exit(gagal ? 1 : 0);
