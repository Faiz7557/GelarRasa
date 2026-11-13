import { test } from "node:test";
import assert from "node:assert/strict";
import { faktaDariRingkasan, ringkasanKesiapan, sortirAlasanAI, templatRingkasan, validasiRingkasan, type AiClient } from "./ai";
import { KATA_TERLARANG } from "./copy";

delete process.env.ANTHROPIC_API_KEY;
const fakta = faktaDariRingkasan(
  {
    hari_menuju_tenggat: 61,
    el_nino: false,
    kesiapan: { siap: 12, wajib: 35, pct: 34.3 },
    per_kabupaten: [
      { nama: "Kab A", siap: 1, wajib: 8, pct: 12.5 },
      { nama: "Kab B", siap: 2, wajib: 6, pct: 33.3 },
      { nama: "Kab C", siap: 0, wajib: 2, pct: 0 },
      { nama: "Kab D", siap: 5, wajib: 9, pct: 55.6 },
    ],
    tugas: { terlambat: 4, menunggu_persetujuan: 7 },
  },
  "2027-08-01",
);
const palsu = (teks: string): AiClient => ({ messages: { create: async () => ({ content: [{ type: "text", text: teks }] }) } });

test("tanpa kunci: kata kunci", async () => {
  assert.deepEqual(await sortirAlasanAI("jembatan putus"), { alasan: "akses_terputus", sumber: "kata_kunci" });
});
test("tanpa kunci: templat bersih", async () => {
  const r = await ringkasanKesiapan(fakta);
  assert.equal(r.sumber, "template");
  assert.ok(!KATA_TERLARANG.some((k) => r.teks.toLowerCase().includes(k.toLowerCase())));
  assert.ok(!r.teks.includes("Kab C"));
});
test("validator menolak angka asing / kata terlarang", () => {
  assert.ok(validasiRingkasan("Kesiapan 34,3% dari 35 blok, demo.", fakta));
  assert.ok(!validasiRingkasan("Kesiapan 99% dari 35 blok, demo.", fakta));
  assert.ok(!validasiRingkasan("Kesiapan 34,3% prediksi baik, demo.", fakta));
  assert.ok(!validasiRingkasan("Kesiapan 34,3% dari 35 blok.", fakta));
});
test("jalur AI (client palsu): enum valid diterima, di luar enum jatuh", async () => {
  assert.deepEqual(await sortirAlasanAI("x1", { client: palsu('{"alasan":"bukan_gambut"}') }), { alasan: "bukan_gambut", sumber: "ai" });
  assert.deepEqual(await sortirAlasanAI("jembatan putus 2", { client: palsu('{"alasan":"ngawur"}') }), { alasan: "akses_terputus", sumber: "kata_kunci" });
  const galat: AiClient = { messages: { create: async () => { throw new Error("x"); } } };
  assert.equal((await sortirAlasanAI("x3", { client: galat })).sumber, "kata_kunci");
});
test("ringkasan AI: angka asing ditolak, valid diterima", async () => {
  assert.equal((await ringkasanKesiapan(fakta, { client: palsu("Ada 777 blok siap, demo.") })).sumber, "template");
  const ok = "Tersisa 61 hari; 12 dari 35 blok siap (34,3%), data demo.";
  assert.deepEqual(await ringkasanKesiapan(fakta, { client: palsu(ok) }), { teks: ok, sumber: "ai" });
});
test("templat lolos validator sendiri", () => assert.ok(validasiRingkasan(templatRingkasan(fakta), fakta)));
