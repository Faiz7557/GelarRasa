import { Card, CardTitle } from "@/components/ui/Card";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { AMBANG_AIR_CM } from "@/lib/rules";
import { fmtTanggal } from "@/lib/format";
import { peatGeometry } from "./peat";

const X0 = 135, W = 130, X1 = X0 + W, DX = 56, DY = -28;
const CX0 = 173, CX1 = 217, CANAL = 50, Y_MIN = 28;
const GELAP = "#3B2A1A", TABAT = "#D4943A", AIR = "#2F5E7A", TINTA = "#2C2318";

const KONDISI: Record<string, string> = {
  baik: "baik",
  rembes: "rembes",
  rusak: "rusak",
  jebol: "jebol",
  tidak_ada: "tidak ada",
};

function Tabat({ kondisi, yp }: { kondisi: string; yp: number }) {
  const t = yp + 6, b = yp + CANAL, h = (b - t) / 3, w = CX1 - CX0;
  const plank = (i: number, x = CX0, ww = w) => (
    <rect key={`${i}-${x}`} x={x} y={t + i * h} width={ww} height={h} fill={TABAT} stroke={TINTA} strokeWidth={1.5} />
  );
  if (kondisi === "tidak_ada")
    return <rect x={CX0 + 1} y={t} width={w - 2} height={b - t} fill="none" stroke="#F0E6D3" strokeWidth={1.5} strokeDasharray="4 3" />;
  if (kondisi === "jebol")
    return (
      <g>
        {[0, 1, 2].map((i) => plank(i, CX0, 12))}
        {[0, 1, 2].map((i) => plank(i, CX1 - 12, 12))}
      </g>
    );
  return (
    <g>
      {[0, 1, 2].map((i) => plank(i))}
      {kondisi === "rusak" && (
        <polyline points={`${CX0 + 6},${t} ${CX0 + 18},${t + h * 1.4} ${CX0 + 12},${t + h * 2} ${CX0 + 26},${b}`} fill="none" stroke={TINTA} strokeWidth={2} />
      )}
      {kondisi === "rembes" &&
        [CX0 + 12, CX0 + 30].map((x) => (
          <path key={x} d={`M${x} ${b + 1} q-3 6 0 8 q3 -2 0 -8z`} fill="#9CC3DA" stroke={TINTA} strokeWidth={1} />
        ))}
    </g>
  );
}

export function PeatSection({
  mukaAirCm,
  kondisiTabat,
  tabatId,
  tanggal,
}: {
  mukaAirCm: number | null;
  kondisiTabat: string | null;
  tabatId: string | null;
  tanggal?: string | null;
}) {
  const g = peatGeometry(mukaAirCm, AMBANG_AIR_CM);
  const { yPermukaan: yp, yAmbang: ya, yAir, yDasar: yb } = g;
  const ym = yb + Y_MIN;
  const airAtas = g.status === "aman"; // label air di atas garisnya, ambang di bawah (dan sebaliknya)
  const warnaAir = g.status === "kering" ? "fill-air-kering" : g.status === "aman" ? "fill-air-aman" : "fill-ink-2";
  const tabatTeks = kondisiTabat
    ? `${tabatId ? `Tabat ${tabatId}` : "Tabat"}: ${KONDISI[kondisiTabat] ?? kondisiTabat.replaceAll("_", " ")}`
    : "Kondisi tabat belum dicatat";
  const aria =
    "Penampang gambut, ilustrasi. " +
    (g.status === "belum"
      ? "Muka air belum diukur. "
      : `Muka air ${g.label} di bawah permukaan, ${g.status === "kering" ? "di bawah" : "dalam"} ambang ${AMBANG_AIR_CM} cm. `) +
    `${tabatTeks}.`;
  const ln = (y: number) => `M${X0 - 8} ${y}H${X1}l${DX} ${DY}`;
  const fs = { fontSize: 14, fontWeight: 600 } as const;

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle>Penampang gambut</CardTitle>
        <DemoBadge />
      </div>
      <svg viewBox="0 0 340 262" role="img" aria-label={aria} className="mx-auto mt-2 block h-auto w-full max-w-[460px]">
        <defs>
          <linearGradient id="peat-f" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8A6A48" />
            <stop offset="1" stopColor="#6B4A2E" />
          </linearGradient>
          <linearGradient id="peat-r" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6B4A2E" />
            <stop offset="1" stopColor="#4F3622" />
          </linearGradient>
        </defs>
        <polygon points={`${X0 + 8},${ym + 6} ${X1 + 8},${ym + 6} ${X1 + DX + 12},${ym + DY + 4} ${X0 + DX + 12},${ym + DY + 4}`} fill={TINTA} opacity={0.12} />
        {/* sisi depan, kanan, atas */}
        <rect x={X0} y={yp} width={W} height={yb - yp} fill="url(#peat-f)" />
        <rect x={X0} y={yb} width={W} height={Y_MIN} fill="#C9B48F" />
        <polygon points={`${X1},${yp} ${X1 + DX},${yp + DY} ${X1 + DX},${yb + DY} ${X1},${yb}`} fill="url(#peat-r)" />
        <polygon points={`${X1},${yb} ${X1 + DX},${yb + DY} ${X1 + DX},${ym + DY} ${X1},${ym}`} fill="#A8946F" />
        <polygon points={`${X0},${yp} ${X1},${yp} ${X1 + DX},${yp + DY} ${X0 + DX},${yp + DY}`} fill="#9A7A56" />
        {/* kanal */}
        <polygon points={`${CX0},${yp} ${CX1},${yp} ${CX1 + DX},${yp + DY} ${CX0 + DX},${yp + DY}`} fill={GELAP} />
        <rect x={CX0} y={yp} width={CX1 - CX0} height={CANAL} fill={GELAP} />
        {/* muka air terukur */}
        {yAir != null && (
          <g>
            <rect x={X0} y={yAir} width={W} height={yb - yAir} fill={AIR} opacity={0.4} />
            <polygon points={`${X1},${yAir} ${X1 + DX},${yAir + DY} ${X1 + DX},${yb + DY} ${X1},${yb}`} fill={AIR} opacity={0.4} />
            <path d={ln(yAir)} fill="none" stroke="#F0E6D3" strokeWidth={4.5} opacity={0.9} />
            <path d={ln(yAir)} fill="none" stroke={AIR} strokeWidth={2.5} />
          </g>
        )}
        {/* ambang */}
        <path d={ln(ya)} fill="none" stroke="#F0E6D3" strokeWidth={4.5} opacity={0.9} />
        <path d={ln(ya)} fill="none" stroke={TINTA} strokeWidth={2} strokeDasharray="6 4" />
        {kondisiTabat && <Tabat kondisi={kondisiTabat} yp={yp} />}
        <path d={`M${X0} ${yp}H${X1}l${DX} ${DY}M${X1} ${yp}V${ym}`} fill="none" stroke={TINTA} strokeOpacity={0.5} strokeWidth={1} />
        {/* label */}
        <text x={X0 - 12} y={ya + (airAtas ? 17 : -6)} textAnchor="end" className="fill-ink" {...fs}>
          Ambang {AMBANG_AIR_CM} cm
        </text>
        {yAir != null ? (
          <text x={X0 - 12} y={yAir + (airAtas ? -6 : 17)} textAnchor="end" className={warnaAir} {...fs}>
            Muka air {g.label}
          </text>
        ) : (
          <text x={X0 - 12} y={ya + 40} textAnchor="end" className="fill-ink-2" {...fs}>
            Muka air:
            <tspan x={X0 - 12} dy={16}>
              Belum diukur
            </tspan>
          </text>
        )}
        <text x={X0 - 12} y={yp - 6} textAnchor="end" className="fill-ink-2" fontSize={14}>
          Permukaan
        </text>
      </svg>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px] text-ink-2">
        {[
          ["#6B4A2E", "Gambut"],
          ["#C9B48F", "Tanah mineral"],
          [AIR, "Muka air terukur"],
          [TABAT, "Tabat kayu"],
        ].map(([c, t]) => (
          <li key={t} className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm border border-ink/40" style={{ background: c }} />
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px] text-ink-2">
        {tabatTeks}
        {tanggal ? ` · kunjungan ${fmtTanggal(tanggal)}` : ""}. Garis putus-putus: ambang {AMBANG_AIR_CM} cm. Kedalaman gambut: ilustrasi.
      </p>
      <p className="mt-1 text-[13px] text-ink-2">
        Tabat adalah sekat di kanal yang menahan air tetap tinggi; muka air di bawah ambang berarti gambut mudah kering.
      </p>
    </Card>
  );
}
