// Persona fiktif (docs/01 §2, docs/05 §3.4). Bukan data pribadi nyata.
export const PERSONA_IDS = ["koordinator", "regu", "pengelola", "kampus"] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];

export type Persona = {
  id: PersonaId;
  nama: string;
  jabatan: string;
  peran: string;
  login: string;
  wa: string;
  inisial: string;
};

export const PEOPLE: Record<PersonaId, Persona> = {
  koordinator: { id: "koordinator", nama: "Rina Wulandari", jabatan: "Koordinator Pencegahan Karhutla, DLH Provinsi / KPH", peran: "Koordinator", login: "rina@tabat.demo", wa: "628000000001", inisial: "RW" },
  regu: { id: "regu", nama: "Agus Saputra", jabatan: "Ketua Regu MPA / Manggala Agni", peran: "Regu pemeriksa", login: "agus@tabat.demo", wa: "628000000002", inisial: "AS" },
  pengelola: { id: "pengelola", nama: "Hadi Prayitno", jabatan: "Kepala Desa / pengelola lahan", peran: "Pengelola lahan", login: "hadi@tabat.demo", wa: "628000000003", inisial: "HP" },
  kampus: { id: "kampus", nama: "Dewi Anggraini", jabatan: "Mitra kampus (analis data)", peran: "Mitra kampus", login: "dewi@tabat.demo", wa: "628000000004", inisial: "DA" },
};

export const PERSONA_LIST: Persona[] = PERSONA_IDS.map((id) => PEOPLE[id]);
export const isPersonaId = (v: unknown): v is PersonaId => typeof v === "string" && (PERSONA_IDS as readonly string[]).includes(v);
