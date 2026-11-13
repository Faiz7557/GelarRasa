import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { MASUK, TAGLINE } from "@/lib/copy";
import { Wordmark } from "@/components/shell/Wordmark";
import { DemoRibbon } from "@/components/ui/DemoRibbon";
import { Card } from "@/components/ui/Card";
import { IndonesiaInset } from "@/components/map/IndonesiaInset";
import { MasukForm } from "./MasukForm";

export default async function Masuk() {
  if (await getSession()) redirect("/");
  return (
    <>
      <DemoRibbon />
      <main className="relative flex min-h-[calc(100vh-30px)] items-center overflow-hidden px-4 py-8">
        <IndonesiaInset besar className="pointer-events-none absolute left-0 top-4 -ml-[100px] w-[600px] max-w-none sm:top-1/2 sm:-ml-[190px] sm:w-[1100px] sm:-translate-y-1/2" />
        <Card className="relative z-10 mx-auto w-full max-w-md p-6 sm:p-8">
          <Wordmark href={null} />
          <h1 className="mt-6 font-display text-[28px] font-bold leading-[34px] underline decoration-sorot decoration-[3px] underline-offset-8">{MASUK.judul}</h1>
          <p className="mb-6 mt-2 text-ink-2">{TAGLINE}</p>
          <MasukForm />
          <p className="mt-6 text-[13px] leading-[18px] text-ink-3">{MASUK.catatan}</p>
        </Card>
      </main>
    </>
  );
}
