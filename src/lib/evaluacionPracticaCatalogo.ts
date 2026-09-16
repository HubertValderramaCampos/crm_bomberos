// Catálogo fijo del formulario "Evaluación de Práctica" (según planilla original).
// Client-safe: sin dependencias de servidor.

export const SECCIONES_EVAL_PRACTICA = ["PREVIAS", "OPERATIVAS", "FINALES"] as const;
export type SeccionEvalPractica = (typeof SECCIONES_EVAL_PRACTICA)[number];

export const SECCION_EVAL_PRACTICA_LABEL: Record<SeccionEvalPractica, string> = {
  PREVIAS:    "Acciones Previas",
  OPERATIVAS: "Acciones Operativas",
  FINALES:    "Acciones Finales",
};

export const CRITERIOS_EVAL_PRACTICA: Record<SeccionEvalPractica, string[]> = {
  PREVIAS: [
    "Se realizó reunión inicial para distribución de funciones.",
    "Se realizó revisión y preparación de equipos.",
    "La distribución de funciones es la adecuada.",
    "Se denota trabajo en equipo.",
    "El personal considera la línea de mando.",
    "Se ha designado un oficial de seguridad.",
  ],
  OPERATIVAS: [
    "Tiempo de salida adecuados.",
    "Tiempo de llegada adecuado.",
    "El personal actúa según la asignación de funciones.",
    "El personal tiene pleno conocimiento sobre todas las herramientas y accesorios de las unidades.",
    "Se aplicaron correctamente técnicas de intervención.",
    "Se utilizan todos los EPP requeridos para el trabajo.",
    "En algún momento se llegaron a retirar los EPP.",
    "Se utilizan adecuadamente los equipos y herramientas.",
    "La comunicación es aplicada a todo nivel.",
    "El oficial de seguridad realiza la inspección de condiciones de seguridad.",
    "Se realiza el control TAC.",
    "Los tiempos de intervención son los adecuados.",
  ],
  FINALES: [
    "Se realizó reacondicionamiento de las unidades.",
    "Se realizó retroalimentación específica con cada equipo.",
    "Se realizó una retroalimentación general.",
  ],
};

export const TOTAL_ITEMS_EVAL_PRACTICA = Object.values(CRITERIOS_EVAL_PRACTICA)
  .reduce((acc, arr) => acc + arr.length, 0);

export const TIPOS_PRACTICA = [
  "Extinción de Incendios",
  "Rescate Vehicular",
  "Rescate con Cuerdas",
  "Búsqueda y Rescate",
  "MATPEL",
  "Fuga de GLP",
  "APH",
] as const;
