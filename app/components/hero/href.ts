export function heroHref({ elnino, kab, peta3d }: { elnino?: boolean; kab?: string | null; peta3d?: boolean }) {
  const q = new URLSearchParams();
  if (elnino) q.set("elnino", "1");
  if (kab) q.set("kab", kab);
  if (peta3d) q.set("peta3d", "1");
  const s = q.toString();
  return s ? `/?${s}` : "/";
}
