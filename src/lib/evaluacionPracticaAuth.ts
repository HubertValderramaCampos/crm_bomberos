import { ROLES_JEFE } from "@/lib/roles";
import pool from "@/lib/db";

// Roles con acceso de edición por defecto. Además, el jefe puede autorizar
// usuarios individuales puntuales vía evaluacion_practica_editor.
export const ROLES_EDITORES_EVAL_PRACTICA: string[] = [...ROLES_JEFE, "OPERACIONES"];

export async function puedeEditarEvaluacionPractica(
  usuarioId: string | number,
  rol: string
): Promise<boolean> {
  if (ROLES_EDITORES_EVAL_PRACTICA.includes(rol)) return true;
  const { rows } = await pool.query(
    `SELECT 1 FROM evaluacion_practica_editor WHERE usuario_id = $1`,
    [Number(usuarioId)]
  );
  return rows.length > 0;
}
