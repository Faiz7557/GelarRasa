"use client";

import { PERSONA_LIST, type PersonaId } from "@/lib/people";

export function PersonaPicker({ aktif }: { aktif: PersonaId }) {
  async function ganti(id: string) {
    const r = await fetch("/api/auth/ganti", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ persona: id }) });
    if (r.ok) location.reload();
  }
  return (
    <select aria-label="Ganti persona" value={aktif} onChange={(e) => ganti(e.target.value)} className="h-11 min-w-0 rounded-control border border-line-2 bg-panel px-2 text-[14px]">
      {PERSONA_LIST.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nama.split(" ")[0]} · {p.peran}
        </option>
      ))}
    </select>
  );
}
