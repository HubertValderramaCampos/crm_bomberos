export const ROLES = {
  JEFE_COMPANIA:       "JEFE_COMPANIA",
  ADMINISTRACION:      "ADMINISTRACION",
  SERVICIOS_GENERALES: "SERVICIOS_GENERALES",
  INSTRUCCION:         "INSTRUCCION",
  SANIDAD:             "SANIDAD",
  OPERACIONES:         "OPERACIONES",
  IMAGEN:              "IMAGEN",
  BOMBERO:             "BOMBERO",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ROL_LABELS: Record<Rol, string> = {
  JEFE_COMPANIA:       "Jefe de Compañía",
  ADMINISTRACION:      "Área de Administración",
  SERVICIOS_GENERALES: "Área de Servicios Generales",
  INSTRUCCION:         "Área de Instrucción",
  SANIDAD:             "Área de Sanidad",
  OPERACIONES:         "Área de Operaciones",
  IMAGEN:              "Área de Imagen",
  BOMBERO:             "Efectivo",
};

export const PATH_AREA_MAP: Record<string, Rol[]> = {
  "/administracion": ["JEFE_COMPANIA", "ADMINISTRACION"],
  "/servicios-generales": ["JEFE_COMPANIA", "SERVICIOS_GENERALES"],
  "/instruccion": ["JEFE_COMPANIA", "INSTRUCCION"],
  "/sanidad": ["JEFE_COMPANIA", "SANIDAD"],
  "/operaciones": ["JEFE_COMPANIA", "OPERACIONES"],
  "/imagen": ["JEFE_COMPANIA", "IMAGEN"],
};

export function canAccessPath(rol: string, pathname: string): boolean {
  const areaPrefix = Object.keys(PATH_AREA_MAP).find((prefix) =>
    pathname.startsWith(prefix)
  );
  if (!areaPrefix) return true;
  return (PATH_AREA_MAP[areaPrefix] as string[]).includes(rol);
}

export function getDefaultPath(rol: string): string {
  const map: Record<string, string> = {
    JEFE_COMPANIA:       "/dashboard",
    ADMINISTRACION:      "/administracion",
    SERVICIOS_GENERALES: "/servicios-generales",
    INSTRUCCION:         "/instruccion",
    SANIDAD:             "/sanidad",
    OPERACIONES:         "/operaciones",
    IMAGEN:              "/imagen",
    BOMBERO:             "/mi-perfil",
  };
  return map[rol] ?? "/dashboard";
}
