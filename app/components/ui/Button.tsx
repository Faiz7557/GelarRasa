import { cn } from "@/lib/cn";

export type ButtonVarian = "primer" | "aksen" | "sekunder" | "ghost";
export type ButtonUkuran = "md" | "lg";

const VARIAN: Record<ButtonVarian, string> = {
  primer: "bg-aksen text-panel hover:brightness-95",
  aksen: "bg-aksen text-panel hover:brightness-95",
  sekunder: "border border-line-2 bg-panel text-ink hover:bg-panel-2",
  ghost: "text-ink-2 hover:bg-ink/5",
};
const UKURAN: Record<ButtonUkuran, string> = { md: "h-10 px-4 text-[14px]", lg: "h-14 px-6 text-[16px]" };

export function Button({
  varian = "sekunder",
  ukuran = "md",
  className,
  type = "button",
  ...p
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { varian?: ButtonVarian; ukuran?: ButtonUkuran }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIAN[varian],
        UKURAN[ukuran],
        className,
      )}
      {...p}
    />
  );
}
