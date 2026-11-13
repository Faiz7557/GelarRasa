import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SHELL } from "@/lib/copy";
import { getRingkasan } from "@/lib/data";
import { DemoRibbon } from "@/components/ui/DemoRibbon";
import { Header } from "@/components/shell/Header";
import { Sidebar } from "@/components/shell/Sidebar";
import { Tour } from "@/components/tour/Tour";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const persona = await getSession();
  if (!persona) redirect("/masuk");

  const { terlambat } = getRingkasan().tugas;

  return (
    <div className="min-h-screen">
      <a href="#konten" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-control focus:bg-panel focus:px-3 focus:py-2">
        {SHELL.lewatiKonten}
      </a>
      <div className="sticky top-0 z-30">
        <DemoRibbon />
        <Header persona={persona} />
      </div>
      <div className="flex">
        <Sidebar terlambat={terlambat} />
        <main id="konten" className="min-w-0 flex-1 px-4 pb-24 pt-6 md:px-6 md:pb-12">
          <div className="mx-auto max-w-[1280px]">{children}</div>
        </main>
      </div>
      <Tour />
    </div>
  );
}
