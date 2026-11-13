import { PITA_DEMO } from "@/lib/copy";

export function DemoRibbon() {
  return (
    <div role="note" data-gelap className="border-b-2 border-dashed border-sorot bg-ink px-4 py-1.5 text-center text-[13px] font-medium leading-[18px] text-ground">
      {PITA_DEMO}
    </div>
  );
}
