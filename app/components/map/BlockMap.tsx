"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";

/** MapLibre hanya di klien (docs/02 §10). Props lengkap: lihat BlockMapProps di BlockMapInner. */
const BlockMap = dynamic(() => import("./BlockMapInner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[560px] w-full rounded-card" />,
});
export default BlockMap;
export type { BlockMapProps } from "./BlockMapInner";
