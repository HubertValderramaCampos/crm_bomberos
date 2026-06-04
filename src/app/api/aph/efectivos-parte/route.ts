import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/aph/efectivos-parte?emergencia_id=X
// Devuelve los bomberos que salieron a esa emergencia (para el modal de crear evaluación)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const emergenciaId = searchParams.get("emergencia_id");
  if (!emergenciaId) return NextResponse.json({ error: "Falta emergencia_id" }, { status: 400 });

  try {
    const { rows } = await pool.query(`
      SELECT ee.bombero_id, b.apellidos, b.nombres, b.grado, b.codigo
      FROM emergencia_efectivo ee
      JOIN bombero b ON b.id = ee.bombero_id
      WHERE ee.emergencia_id = $1
      ORDER BY b.apellidos
    `, [emergenciaId]);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/aph/efectivos-parte]", err);
    return NextResponse.json({ error: "Error al cargar efectivos" }, { status: 500 });
  }
}
