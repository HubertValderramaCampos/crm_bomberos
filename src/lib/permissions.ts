import { ROLES_JEFE } from "@/lib/roles";
export const ROLES = {
  JEFE_COMPANIA:       "JEFE_COMPANIA",
  SEGUNDO_JEFE:        "SEGUNDO_JEFE",
  ADMINISTRACION:      "ADMINISTRACION",
  SERVICIOS_GENERALES: "SERVICIOS_GENERALES",
  INSTRUCCION:         "INSTRUCCION",
  SANIDAD:             "SANIDAD",
  OPERACIONES:         "OPERACIONES",
  IMAGEN:              "IMAGEN",
  BOMBERO:             "BOMBERO",
  JEFE_GUARDIA:        "JEFE_GUARDIA",
} as const;

export type Rol = (typeof ROLES)[keyof typeof ROLES];

export const ROL_LABELS: Record<Rol, string> = {
  JEFE_COMPANIA:       "Jefe de Compañía",
  SEGUNDO_JEFE:        "Segundo Jefe",
  ADMINISTRACION:      "Área de Administración",
  SERVICIOS_GENERALES: "Área de Servicios Generales",
  INSTRUCCION:         "Área de Instrucción",
  SANIDAD:             "Área de Sanidad",
  OPERACIONES:         "Área de Operaciones",
  IMAGEN:              "Área de Imagen",
  BOMBERO:             "Efectivo",
  JEFE_GUARDIA:        "Jefe de Guardia",
};

export const PATH_AREA_MAP: Record<string, string[]> = {
  "/administracion":    [...ROLES_JEFE],
  "/servicios-generales": ["JEFE_COMPANIA", "SEGUNDO_JEFE", "SERVICIOS_GENERALES"],
  "/instruccion":       ["JEFE_COMPANIA", "SEGUNDO_JEFE", "INSTRUCCION"],
  "/sanidad":           ["JEFE_COMPANIA", "SEGUNDO_JEFE", "SANIDAD"],
  "/operaciones":       ["JEFE_COMPANIA", "SEGUNDO_JEFE", "OPERACIONES"],
  "/imagen":            ["JEFE_COMPANIA", "SEGUNDO_JEFE", "IMAGEN"],
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
    SEGUNDO_JEFE:        "/dashboard",
    ADMINISTRACION:      "/administracion",
    SERVICIOS_GENERALES: "/servicios-generales",
    INSTRUCCION:         "/instruccion",
    SANIDAD:             "/sanidad",
    OPERACIONES:         "/operaciones",
    IMAGEN:              "/imagen",
    BOMBERO:             "/mi-perfil",
    JEFE_GUARDIA:        "/guardias",
  };
  return map[rol] ?? "/dashboard";
}
