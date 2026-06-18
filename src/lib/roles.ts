// Usamos un array tipado explícitamente para que .includes(string) no genere error TS
const _ROLES_JEFE = ["JEFE_COMPANIA", "SEGUNDO_JEFE", "ADMINISTRACION"] as const;
export type RolJefe = typeof _ROLES_JEFE[number];

// Array como string[] para que .includes(session.user.rol) no genere TS2345
export const ROLES_JEFE: string[] = [..._ROLES_JEFE];

export function esRolJefe(rol: string | undefined | null): boolean {
  return ROLES_JEFE.includes(rol ?? "");
}
