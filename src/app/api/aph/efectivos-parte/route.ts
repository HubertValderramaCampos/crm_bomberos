import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/aph/efectivos-parte?emergencia_id=X  → efectivos del parte (con fallback a todos activos)
// GET /api/aph/efectivos-parte                  → todos los bomberos activos (para buscador de evaluador)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const emergenciaId = searchParams.get("emergencia_id");

  try {
    if (emergenciaId) {
      // Efectivos nominales que salieron a ese parte
      const { rows } = await pool.query(`
        SELECT ee.bombero_id, b.apellidos, b.nombres, b.grado, b.codigo, ee.rol
        FROM emergencia_efectivo ee
        JOIN bombero b ON b.id = ee.bombero_id
        WHERE ee.emergencia_id = $1
        ORDER BY b.apellidos, b.nombres
      `, [emergenciaId]);
      return NextResponse.json(rows);
    }

    // Sin emergencia_id → lista completa para buscador de evaluador
    const { rows } = await pool.query(`
      SELECT id AS bombero_id, apellidos, nombres, grado, codigo
      FROM bombero
      WHERE activo = true
      ORDER BY apellidos, nombres
    `);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/aph/efectivos-parte]", err);
    return NextResponse.json({ error: "Error al cargar efectivos" }, { status: 500 });
  }
}
