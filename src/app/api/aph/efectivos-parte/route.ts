import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/aph/efectivos-parte?emergencia_id=X
// Devuelve todos los bomberos activos (para que el jefe elija quiénes salieron)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  try {
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
