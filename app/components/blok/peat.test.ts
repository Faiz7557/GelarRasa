import { test } from "node:test";
import assert from "node:assert/strict";
import { peatGeometry, Y_DASAR } from "./peat";

test("status air", () => {
  assert.equal(peatGeometry(61).status, "kering");
  assert.equal(peatGeometry(40).status, "aman");
});
test("belum diukur: tanpa garis air", () => {
  const g = peatGeometry(null);
  assert.equal(g.yAir, null);
  assert.equal(g.status, "belum");
  assert.equal(g.label, "Belum diukur");
});
test("ekstrem 0 dan 200 cm", () => {
  const g0 = peatGeometry(0);
  assert.equal(g0.yAir, g0.yPermukaan);
  const g = peatGeometry(200);
  assert.equal(g.yAir, Y_DASAR);
  assert.equal(g.label, "≥ 120 cm");
});
