import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/auth";
import { DemoRibbon } from "@/components/ui/DemoRibbon";
import { Wordmark } from "@/components/shell/Wordmark";
import { PersonaPicker } from "@/components/field/PersonaPicker";
import { RegisterSW } from "@/components/field/RegisterSW";

export default async function LapanganLayout({ children }: { children: React.ReactNode }) {
  const persona = await getSession();
  if (!persona) redirect("/masuk");
  return (
    <div className="min-h-screen bg-ground">
      <DemoRibbon />
      <div className="mx-auto w-full max-w-[480px] px-4 pb-24 pt-3">
        <header className="mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <Wordmark href={null} />
            <PersonaPicker aktif={persona.id} />
          </div>
          <div className="flex items-center justify-between text-[14px] text-ink-2">
            <span>
              {persona.nama} · {persona.peran}
            </span>
            <Link href="/" className="inline-flex min-h-11 items-center gap-1 font-medium text-ink underline">
              <ArrowLeft size={16} aria-hidden /> Kembali ke dasbor
            </Link>
          </div>
        </header>
        <main>
          <h1 className="sr-only">Tugas lapangan</h1>
          {children}
        </main>
        <RegisterSW />
      </div>
    </div>
  );
}
