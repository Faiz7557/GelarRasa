"use client";

import BlockMap from "@/components/map/BlockMap";

export function BlockMiniMap({ id, lon, lat }: { id: number; lon: number; lat: number }) {
  return <BlockMap highlightId={id} focus={[lon, lat]} inset={false} height={260} className="w-full" />;
}
