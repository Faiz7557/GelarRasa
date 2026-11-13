import { cn } from "@/lib/cn";

export function Skeleton({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn("animate-pulse rounded-control bg-ink/10 motion-reduce:animate-none", className)} {...p} />;
}
