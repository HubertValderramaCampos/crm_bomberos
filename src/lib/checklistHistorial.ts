import pool from "./db";

export type AccionHistorialChecklist = "INICIO" | "ITEM" | "COMPLETADO";

export async function registrarHistorialChecklist(
  registroId: number,
  usuarioId: string,
  usuarioNombre: string,
  accion: AccionHistorialChecklist,
  detalle?: string | null
) {
  await pool.query(
    `INSERT INTO checklist_registro_historial (registro_id, usuario_id, usuario_nombre, accion, detalle)
     VALUES ($1, $2, $3, $4, $5)`,
    [registroId, Number(usuarioId), usuarioNombre, accion, detalle ?? null]
  );
}
