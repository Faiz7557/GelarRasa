"use client";

import type { BlockMapProps } from "./BlockMapInner";
import BlockMap from "./BlockMap";

/** Peta hero: choropleth % siap per kabupaten (mode 'kabupaten'). */
export default function KabupatenMap(p: Omit<BlockMapProps, "mode" | "filter" | "highlightId" | "onBlockClick">) {
  return <BlockMap {...p} mode="kabupaten" />;
}
