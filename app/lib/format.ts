// Format tampilan (id-ID). Aman dipakai klien dan server.
import { daysBetween } from './rules';

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function fmtNum(x: number, digits = 0): string {
  return x.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
/** fmtPct(46.2) -> "46,2%" */
export function fmtPct(x: number, digits = 1): string {
  return `${fmtNum(x, digits)}%`;
}
/** fmtTanggal('2027-08-01') -> "1 Agu 2027" */
export function fmtTanggal(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${d} ${BULAN[m - 1]} ${y}`;
}
export function fmtHa(x: number, digits = 0): string {
  return `${fmtNum(x, digits)} ha`;
}
/** Hari dari asOf sampai deadline (negatif bila lewat). */
export function hariMenuju(asOf: string, deadline: string): number {
  return daysBetween(asOf, deadline);
}
