import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { FieldApp } from "@/components/field/FieldApp";

export default async function Lapangan({ searchParams }: { searchParams: Promise<{ blok?: string }> }) {
  const persona = await getSession();
  if (!persona) redirect("/masuk");
  const { blok } = await searchParams;
  return <FieldApp persona={persona.id} blokAwal={blok && /^\d{1,9}$/.test(blok) ? Number(blok) : null} />;
}
