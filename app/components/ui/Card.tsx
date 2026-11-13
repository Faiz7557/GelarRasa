import { cn } from "@/lib/cn";

type Props = React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article"; padded?: boolean; pita?: boolean };

export function Card({ as: Tag = "section", padded = true, pita = false, className, ...p }: Props) {
  return <Tag className={cn("rounded-card border border-line bg-panel", padded && "p-5", pita && "border-l-4 border-l-aksen", className)} {...p} />;
}

export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-[18px] font-semibold leading-6 text-ink", className)} {...p} />;
}
