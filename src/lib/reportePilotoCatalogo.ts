// Catálogo fijo del formulario "Reporte Diario de Pilotos / Operaciones B150".
// Client-safe: sin dependencias de servidor.

export const NIVELES_COMBUSTIBLE = ["FULL", "TRES_CUARTOS", "MEDIO", "UN_CUARTO"] as const;
export type NivelCombustible = (typeof NIVELES_COMBUSTIBLE)[number];

export const NIVEL_COMBUSTIBLE_LABEL: Record<NivelCombustible, string> = {
  FULL:         "Full",
  TRES_CUARTOS: "3/4",
  MEDIO:        "1/2",
  UN_CUARTO:    "1/4",
};

export const NIVELES_ACEITE_REFRIGERANTE = ["FULL", "MINIMO"] as const;
export type NivelAceiteRefrigerante = (typeof NIVELES_ACEITE_REFRIGERANTE)[number];

export const NIVEL_ACEITE_REFRIGERANTE_LABEL: Record<NivelAceiteRefrigerante, string> = {
  FULL:   "Full",
  MINIMO: "Mínimo (comunicar inmediatamente al responsable de sección)",
};

export const MAX_FOTOS_REPORTE_PILOTO = 5;
export const MAX_MB_POR_FOTO_PILOTO = 8;
