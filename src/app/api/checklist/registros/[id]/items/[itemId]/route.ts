import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { registrarHistorialChecklist } from "@/lib/checklistHistorial";
import pool from "@/lib/db";

const ESTADOS_VALIDOS = ["PENDIENTE", "BUENO", "MALO", "FALTA"];
const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente", BUENO: "Bueno", MALO: "Malo", FALTA: "Falta",
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, itemId } = await params;
  const body = await req.json();
  const { estado, observacion, fotoKey } = body;

  if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const regRes = await pool.query<{ estado: string }>(
    `SELECT estado FROM checklist_registro WHERE id = $1`, [id]
  );
  if (regRes.rows.length === 0) return NextResponse.json({ error: "Checklist no encontrado" }, { status: 404 });
  const registro = regRes.rows[0];

  // Cualquier efectivo autenticado puede continuar un checklist EN_PROGRESO;
  // cada cambio de estado queda registrado en el historial para trazabilidad.
  if (registro.estado !== "EN_PROGRESO") {
    return NextResponse.json({ error: "Este checklist ya está completado" }, { status: 400 });
  }

  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;
  if (estado !== undefined)      { campos.push(`ri.estado = $${i++}`);      valores.push(estado); }
  if (observacion !== undefined) { campos.push(`ri.observacion = $${i++}`); valores.push(observacion || null); }
  if (fotoKey !== undefined)     { campos.push(`ri.foto_key = $${i++}`);    valores.push(fotoKey || null); }
  if (campos.length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  valores.push(itemId, id);
  const { rows } = await pool.query<{ id: number; estado: string; observacion: string | null; foto_key: string | null; articulo: string }>(
    `UPDATE checklist_registro_item ri SET ${campos.join(", ")}
     FROM checklist_item ci
     WHERE ri.id = $${i++} AND ri.registro_id = $${i} AND ci.id = ri.item_id
     RETURNING ri.id, ri.estado, ri.observacion, ri.foto_key, ci.articulo`,
    valores
  );

  if (rows.length === 0) return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });

  await pool.query(`UPDATE checklist_registro SET updated_at = NOW() WHERE id = $1`, [id]);

  if (estado !== undefined) {
    await registrarHistorialChecklist(
      Number(id), session.user.id, session.user.nombres, "ITEM",
      `${rows[0].articulo}: ${ESTADO_LABEL[estado] ?? estado}`
    );
  }

  const { id: itemRegId, estado: estadoFinal, observacion: observacionFinal, foto_key } = rows[0];
  return NextResponse.json({ id: itemRegId, estado: estadoFinal, observacion: observacionFinal, foto_key });
}
