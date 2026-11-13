import "server-only";
import { all } from "./db";
import { getReplay } from "./data";

export type Skenario = { skenario: string; label: string; blok: number; pct_blok: number; pct_tangkap_2023: number };
export type TitikKurva = { n_blok: number; pct_blok: number; pct_tangkap: number; pct_acak: number };

import { BIT } from "@/components/bukti/bits";

/** Bit per blok: 1 = berjejak 2015–2022 (block_years pos_cells>0), 2 = prioritas (rep_cells_2015_22>0), 4 = ada jejak 2023. */

export type ReplayData = {
  skenario: Skenario[];
  kurva: TitikKurva[];
  /** [block_id, bit] hanya untuk blok yang punya setidaknya satu bit. */
  blok: [number, number][];
  hitung: { berjejak: number; prioritas: number; jejak2023: number; jejak2023Prioritas: number; sel2023: number; sel2023Prioritas: number };
};

export function getReplayData(): ReplayData {
  const r = getReplay();
  const ever = new Set(all<{ block_id: number }>("select distinct block_id from block_years where tahun between 2015 and 2022 and pos_cells > 0").map((x) => x.block_id));
  const rb = r.blok as { block_id: number; rep_cells_2015_22: number; pos_2023_cells: number }[];
  const m = new Map<number, number>();
  for (const id of ever) m.set(id, BIT.BERJEJAK);
  const h = { berjejak: ever.size, prioritas: 0, jejak2023: 0, jejak2023Prioritas: 0, sel2023: 0, sel2023Prioritas: 0 };
  for (const b of rb) {
    let v = m.get(b.block_id) ?? 0;
    const pri = b.rep_cells_2015_22 > 0;
    if (pri) { v |= BIT.PRIORITAS; h.prioritas++; }
    if (b.pos_2023_cells > 0) {
      v |= BIT.JEJAK_2023;
      h.jejak2023++;
      h.sel2023 += b.pos_2023_cells;
      if (pri) { h.jejak2023Prioritas++; h.sel2023Prioritas += b.pos_2023_cells; }
    }
    if (v) m.set(b.block_id, v);
  }
  return { skenario: r.skenario as Skenario[], kurva: r.kurva as TitikKurva[], blok: [...m], hitung: h };
}
