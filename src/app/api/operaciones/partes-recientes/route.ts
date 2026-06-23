import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT e.id, e.numero_parte, e.tipo, e.created_at::text,
           b.grado || ' ' || b.apellidos || ', ' || b.nombres AS al_mando_nombre
    FROM emergencia e
    LEFT JOIN bombero b ON b.id = e.al_mando_id
    WHERE e.tipo NOT IN ('COMISION', 'EMERGENCIA CANCELADA')
    ORDER BY e.created_at DESC
    LIMIT 100
  `);
  return NextResponse.json(rows);
}
