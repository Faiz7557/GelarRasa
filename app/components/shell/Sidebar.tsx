"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, History, ListTodo, Map, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { GRUP_MENU, MENU_LAPANGAN, SHELL } from "@/lib/copy";
import { Badge } from "@/components/ui/Badge";

const IKON: Record<string, LucideIcon> = { CalendarClock, Map, ListTodo, History, ShieldCheck };

const aktif = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));

/** Sidebar 248 px (desktop) dan bar bawah (≤ 768 px). `terlambat` = jumlah tugas terlambat (badge pada Tugas). */
export function Sidebar({ terlambat }: { terlambat?: number }) {
  const path = usePathname();
  const flat = GRUP_MENU.flatMap((g) => g.item);

  return (
    <>
      <aside data-gelap className="hidden w-[248px] shrink-0 bg-ink md:block">
        <nav aria-label={SHELL.menuUtama} className="sticky top-[88px] flex flex-col gap-6 p-4">
          {GRUP_MENU.map((g) => (
            <div key={g.pertanyaan}>
              <p className="mb-1 px-3 text-[13px] font-medium leading-[18px] text-on-dark-2">{g.pertanyaan}</p>
              <ul className="flex flex-col gap-0.5">
                {g.item.map((it) => {
                  const Ikon = IKON[it.ikon];
                  const on = aktif(path, it.href);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        aria-current={on ? "page" : undefined}
                        data-tour={it.kunci === "tugas" || it.kunci === "bukti" ? it.kunci : undefined}
                        className={cn("flex items-center gap-3 rounded-control px-3 py-2 text-[15px] font-medium", on ? "bg-sorot text-ink" : "text-ground hover:bg-ground/10")}
                      >
                        <Ikon size={20} strokeWidth={1.75} aria-hidden />
                        <span className="flex-1">{it.label}</span>
                        {it.kunci === "tugas" && !!terlambat && <Badge varian="telat">{SHELL.badgeTerlambat(terlambat)}</Badge>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="border-t border-ground/15 pt-4">
            <Link href={MENU_LAPANGAN.href} className="flex items-center gap-3 rounded-control px-3 py-2 text-[15px] font-medium text-ground hover:bg-ground/10">
              <Smartphone size={20} strokeWidth={1.75} aria-hidden />
              <span>
                {MENU_LAPANGAN.label}
                <span className="block text-[13px] font-normal leading-[18px] text-on-dark-2">{MENU_LAPANGAN.catatan}</span>
              </span>
            </Link>
          </div>
        </nav>
      </aside>

      <nav data-gelap aria-label={SHELL.menuUtama} className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ground/15 bg-ink md:hidden">
        {[...flat, { kunci: "lapangan", label: "Lapangan", href: MENU_LAPANGAN.href, ikon: "Smartphone" }].map((it) => {
          const Ikon = it.ikon === "Smartphone" ? Smartphone : IKON[it.ikon];
          const on = aktif(path, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={on ? "page" : undefined}
              data-tour={it.kunci === "tugas" || it.kunci === "bukti" ? it.kunci : undefined}
              className={cn("flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium leading-[14px]", on ? "text-ground" : "text-on-dark-2")}
            >
              <span className={cn("rounded-full px-3 py-0.5", on && "bg-sorot text-ink")}>
                <Ikon size={20} strokeWidth={1.75} aria-hidden />
              </span>
              <span className="max-w-full truncate">{it.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
