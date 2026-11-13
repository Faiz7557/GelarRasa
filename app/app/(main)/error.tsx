"use client";

import { ErrorCard } from "@/components/ui/ErrorCard";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorCard onRetry={reset} />;
}
