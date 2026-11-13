import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  kelasOf, compareBlocks, deadlineFor, isReady, readiness, waterStatus,
  capacityPlan, urgency, daysBetween, canTransition,
  type BlockLite, type Visit, type Task,
} from './rules';

const blk = (id: number, o: Partial<BlockLite> = {}): BlockLite => ({
  block_id: id, kelas: 'P1', tipe: 3, hotspot: true, repeated_cells: 5, last_year: 2022, gi_z: 1, ...o,
});

test('kelasOf', () => {
  assert.equal(kelasOf(3, true), 'P1');
  assert.equal(kelasOf(3, false), 'P2');
  assert.equal(kelasOf(2, true), 'CEK');
  assert.equal(kelasOf(1, false), 'PANTAU');
  assert.equal(kelasOf(0, false), 'LAIN');
  assert.equal(kelasOf(0, true), 'LAIN'); // hotspot tanpa jejak
});

test('compareBlocks urutan bertingkat', () => {
  const s = [
    blk(4, { repeated_cells: 5, last_year: 2022, gi_z: null }),
    blk(3, { repeated_cells: 5, last_year: 2022, gi_z: 2 }),
    blk(2, { repeated_cells: 5, last_year: 2023 }),
    blk(1, { repeated_cells: 9 }),
    blk(5, { repeated_cells: 5, last_year: 2022, gi_z: 2 }),
  ].sort(compareBlocks).map((b) => b.block_id);
  assert.deepEqual(s, [1, 2, 3, 5, 4]);
});

test('deadlineFor 3 akses + default', () => {
  assert.equal(deadlineFor('jalan'), '2027-07-18');
  assert.equal(deadlineFor('sungai'), '2027-07-11');
  assert.equal(deadlineFor('sulit'), '2027-07-04');
  assert.equal(deadlineFor(null), '2027-07-04');
  assert.equal(deadlineFor('jalan', '2027-09-01'), '2027-08-18');
});

const ten = deadlineFor('jalan');
const okV: Visit = { block_id: 1, tanggal: '2027-06-10', muka_air_cm: 30, kondisi_tabat: 'baik', jenis: 'periksa', foto: 'x' };
const okT: Task = { block_id: 1, jenis: 'periksa', status: 'terbukti', tenggat: ten };

test('isReady 4 kasus', () => {
  assert.equal(isReady({ block_id: 1, tenggat: ten }, [okV], [okT]), true);
  assert.equal(isReady({ block_id: 1, tenggat: ten }, [{ ...okV, muka_air_cm: null }], [okT]), false);
  assert.equal(isReady({ block_id: 1, tenggat: ten }, [okV], [{ ...okT, status: 'diperiksa' }]), false);
  assert.equal(isReady({ block_id: 1, tenggat: ten }, [{ ...okV, tanggal: '2027-07-19' }], [okT]), false);
  assert.equal(isReady({ block_id: 1, tenggat: ten }, [{ ...okV, tanggal: '2027-07-18' }], [okT]), true); // tepat tenggat
});

test('readiness dengan/tanpa El Nino', () => {
  const bs = [blk(1), blk(2), blk(3, { kelas: 'P2', hotspot: false }), blk(4, { kelas: 'CEK', tipe: 2 })];
  const aksesByBlock = { 1: 'jalan' as const };
  assert.deepEqual(readiness(bs, [okV], [okT], { aksesByBlock }), { siap: 1, wajib: 2, pct: 50 });
  assert.deepEqual(readiness(bs, [okV], [okT], { aksesByBlock, elNino: true }), { siap: 1, wajib: 3, pct: 33.3 });
  assert.deepEqual(readiness([], [], []), { siap: 0, wajib: 0, pct: 0 });
});

test('waterStatus', () => {
  assert.equal(waterStatus(40), 'aman');
  assert.equal(waterStatus(41), 'kering');
  assert.equal(waterStatus(null), 'belum');
});

test('capacityPlan urutan, interpolasi, kecepatan', () => {
  const bs = [
    blk(1, { kelas: 'PANTAU', repeated_cells: 99 }),
    blk(2, { kelas: 'P2', repeated_cells: 3 }),
    blk(3, { kelas: 'P1', repeated_cells: 1 }),
    blk(4, { kelas: 'LAIN', repeated_cells: 100 }),
    blk(5, { kelas: 'P1', repeated_cells: 8 }),
  ];
  const curve = [{ n_blok: 2, pct_luas_berulang: 20 }, { n_blok: 4, pct_luas_berulang: 40 }];
  const r = capacityPlan(bs, 3, { coverageCurve: curve });
  assert.deepEqual(r.blocks.map((b) => b.block_id), [5, 3, 2]);
  assert.equal(r.pctLuasBerulang, 30); // interpolasi antara 2 dan 4
  assert.equal(capacityPlan(bs, 1, { coverageCurve: curve }).pctLuasBerulang, 20); // clamp bawah
  assert.equal(capacityPlan(bs, 99, { coverageCurve: curve }).pctLuasBerulang, 40); // clamp atas
  assert.equal(capacityPlan(bs, 99, { elNino: true, coverageCurve: curve }).blocks.length, 4); // LAIN tak masuk

  const big = Array.from({ length: 1841 }, (_, i) => blk(i, { kelas: (['P1', 'P2', 'CEK', 'PANTAU'] as const)[i % 4], repeated_cells: i % 37 }));
  const t0 = performance.now();
  capacityPlan(big, 600, { coverageCurve: curve });
  assert.ok(performance.now() - t0 < 100);
});

test('urgency batas 7 hari', () => {
  assert.equal(urgency('2027-07-04', '2027-06-27', false), 'minggu_ini'); // 7 hari
  assert.equal(urgency('2027-07-04', '2027-06-26', false), 'bulan_ini'); // 8 hari
  assert.equal(urgency('2027-07-04', '2027-07-04', false), 'minggu_ini'); // hari-H
  assert.equal(urgency('2027-07-04', '2027-07-05', false), 'terlambat');
  assert.equal(urgency('2027-07-04', '2027-06-03', false), 'bulan_ini'); // 31 hari
  assert.equal(urgency('2027-07-04', '2027-06-02', false), 'aman'); // 32 hari
  assert.equal(urgency('2027-07-04', '2027-07-20', true), 'aman'); // siap
  assert.equal(daysBetween('2027-02-28', '2027-03-01'), 1);
});

test('canTransition', () => {
  assert.equal(canTransition('usulan', 'disetujui', 'koordinator'), true);
  assert.equal(canTransition('usulan', 'ditolak', 'koordinator'), true);
  assert.equal(canTransition('usulan', 'disetujui', 'regu'), false);
  assert.equal(canTransition('disetujui', 'diperiksa', 'regu'), true);
  assert.equal(canTransition('diperiksa', 'dirawat', 'pengelola'), true);
  assert.equal(canTransition('diperiksa', 'dirawat', 'kampus'), false);
  assert.equal(canTransition('dirawat', 'terbukti', 'kampus', { hasPhotoVisit: true }), true);
  assert.equal(canTransition('dirawat', 'terbukti', 'kampus', { hasPhotoVisit: false }), false);
  assert.equal(canTransition('diperiksa', 'terbukti', 'regu', { hasPhotoVisit: true }), false);
  assert.equal(canTransition('ditolak', 'usulan', 'koordinator'), true);
  assert.equal(canTransition('terbukti', 'usulan', 'kampus'), false);
  assert.equal(canTransition('usulan', 'terbukti', 'koordinator', { hasPhotoVisit: true }), false);
});
