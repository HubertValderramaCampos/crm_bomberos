import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { puedeEditarEvaluacionPractica } from "@/lib/evaluacionPracticaAuth";
import pool from "@/lib/db";

const RESPUESTAS_VALIDAS = ["SI", "NO", null];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const autorizado = await puedeEditarEvaluacionPractica(session.user.id, session.user.rol);
  if (!autorizado) return NextResponse.json({ error: "No tienes permiso para editar esta evaluación" }, { status: 403 });

  const { id, itemId } = await params;
  const { respuesta } = await req.json();

  if (!RESPUESTAS_VALIDAS.includes(respuesta)) {
    return NextResponse.json({ error: "Respuesta inválida" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE evaluacion_practica_item SET respuesta = $1
     WHERE id = $2 AND evaluacion_id = $3
     RETURNING id, respuesta`,
    [respuesta, itemId, id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });

  await pool.query(`UPDATE evaluacion_practica SET updated_at = NOW() WHERE id = $1`, [id]);

  return NextResponse.json(rows[0]);
}
