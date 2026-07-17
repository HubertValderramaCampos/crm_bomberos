// Usamos un array tipado explícitamente para que .includes(string) no genere error TS
const _ROLES_JEFE = ["JEFE_COMPANIA", "SEGUNDO_JEFE", "ADMINISTRACION"] as const;
export type RolJefe = typeof _ROLES_JEFE[number];

// Array como string[] para que .includes(session.user.rol) no genere TS2345
export const ROLES_JEFE: string[] = [..._ROLES_JEFE];

export function esRolJefe(rol: string | undefined | null): boolean {
  return ROLES_JEFE.includes(rol ?? "");
}

// Quién puede administrar/autorizar guardias nocturnas: los jefes de siempre
// más la cuenta dedicada JEFE_GUARDIA.
export const ROLES_GUARDIA: string[] = [..._ROLES_JEFE, "JEFE_GUARDIA"];

export function esRolGuardia(rol: string | undefined | null): boolean {
  return ROLES_GUARDIA.includes(rol ?? "");
}
