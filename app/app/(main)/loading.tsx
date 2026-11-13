import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-2" role="status" aria-label="Memuat">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-[440px]" />
    </div>
  );
}
