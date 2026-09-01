import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import pool from "@/lib/db";

const ESTADOS_VALIDOS = ["PENDIENTE", "BUENO", "MALO", "FALTA"];

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

  const regRes = await pool.query<{ bombero_id: number; estado: string }>(
    `SELECT bombero_id, estado FROM checklist_registro WHERE id = $1`, [id]
  );
  if (regRes.rows.length === 0) return NextResponse.json({ error: "Checklist no encontrado" }, { status: 404 });
  const registro = regRes.rows[0];

  const esDueno = session.user.bomberoId === registro.bombero_id;
  if (!esDueno && !esRolJefe(session.user.rol)) {
    return NextResponse.json({ error: "No puedes editar este checklist" }, { status: 403 });
  }
  if (registro.estado !== "EN_PROGRESO") {
    return NextResponse.json({ error: "Este checklist ya está completado" }, { status: 400 });
  }

  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;
  if (estado !== undefined)      { campos.push(`estado = $${i++}`);      valores.push(estado); }
  if (observacion !== undefined) { campos.push(`observacion = $${i++}`); valores.push(observacion || null); }
  if (fotoKey !== undefined)     { campos.push(`foto_key = $${i++}`);    valores.push(fotoKey || null); }
  if (campos.length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  valores.push(itemId, id);
  const { rows } = await pool.query(
    `UPDATE checklist_registro_item SET ${campos.join(", ")}
     WHERE id = $${i++} AND registro_id = $${i}
     RETURNING id, estado, observacion, foto_key`,
    valores
  );

  if (rows.length === 0) return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });

  await pool.query(`UPDATE checklist_registro SET updated_at = NOW() WHERE id = $1`, [id]);

  return NextResponse.json(rows[0]);
}
