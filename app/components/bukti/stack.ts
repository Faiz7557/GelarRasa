import type { ExpressionSpecification } from "maplibre-gl";
import { C } from "@/components/map/style";

export const TAHUN0 = 2015;
export const N_TAHUN = 10;
/** Satu lapis per tahun: tebal 1800 m, jarak antarlapis 2600 m (celah 800 m; blok ±2,3 km lebar, 800/1200 m terlalu tipis di zoom studi agar lapis terpisah terbaca). */
export const JARAK_LAPIS = 2600;
export const TEBAL_LAPIS = 1800;
export const ABU_LAPIS = "#8C7B66";
export const ABU_LAPIS_2 = "#7A6A57"; // lapis ganjil sedikit lebih gelap agar lapis bersebelahan terbaca
export const CARAMEL = C.tipe2;
export const CLAY = C.tipe3;
/** Lapis 2023 (indeks 8) dinaikkan ini saat belum "jatuh". */
export const ANGKAT_2023 = 14000;

export const idLapis = (i: number) => `tahun-${TAHUN0 + i}`;
export const IDX_2023 = 2023 - TAHUN0;

/** Bit i dari properti `y` = tahun 2015+i berjejak. */
export const filterTahun = (i: number): ExpressionSpecification => [">", ["%", ["floor", ["/", ["get", "y"], 2 ** i]], 2], 0];
