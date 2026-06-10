// Roles con permisos de jefatura (igual acceso que JEFE_COMPANIA)
export const ROLES_JEFE = ["JEFE_COMPANIA", "SEGUNDO_JEFE", "ADMINISTRACION"] as const;

export function esRolJefe(rol: string | undefined | null): boolean {
  return ROLES_JEFE.includes(rol as typeof ROLES_JEFE[number]);
}
