// Catálogo fijo del formulario "Registro de Incidencias / Operaciones B150".
// Client-safe: sin dependencias de servidor.

export const TIPOS_REPORTE = ["DANIO_FALLA", "MANTENIMIENTO", "IMPLEMENTACION"] as const;
export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export const TIPO_REPORTE_LABEL: Record<TipoReporte, string> = {
  DANIO_FALLA:     "Daño o falla",
  MANTENIMIENTO:   "Mantenimiento PV / CR",
  IMPLEMENTACION:  "Implementación",
};

export const CATEGORIAS_EQUIPAMIENTO = ["VEHICULO", "EQUIPO_FUERZA", "HERRAMIENTAS"] as const;
export type CategoriaEquipamiento = (typeof CATEGORIAS_EQUIPAMIENTO)[number];

export const CATEGORIA_EQUIPAMIENTO_LABEL: Record<CategoriaEquipamiento, string> = {
  VEHICULO:      "Vehículo de emergencia",
  EQUIPO_FUERZA: "Equipo de fuerza",
  HERRAMIENTAS:  "Herramientas manuales",
};

export const ESTADOS_REPORTE = ["PENDIENTE", "EN_PROCESO", "RESUELTO"] as const;
export type EstadoReporte = (typeof ESTADOS_REPORTE)[number];

export const ESTADO_REPORTE_LABEL: Record<EstadoReporte, string> = {
  PENDIENTE:  "Pendiente",
  EN_PROCESO: "En proceso",
  RESUELTO:   "Resuelto",
};

export const MAX_FOTOS_REPORTE = 5;
export const MAX_MB_POR_FOTO = 8;
