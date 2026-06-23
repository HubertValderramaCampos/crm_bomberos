import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT e.id, e.numero_parte, e.tipo, e.created_at::text,
           COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at)::text AS fecha_salida,
           e.direccion,
           d.nombre AS distrito,
           te.descripcion AS tipo_desc,
           e.numero_efectivos,
           b.grado || ' ' || b.apellidos || ', ' || b.nombres AS al_mando_nombre
    FROM emergencia e
    LEFT JOIN bombero b         ON b.id  = e.al_mando_id
    LEFT JOIN distrito d        ON d.id  = e.distrito_id
    LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
    WHERE e.tipo NOT IN ('COMISION', 'EMERGENCIA CANCELADA')
    ORDER BY COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at) DESC
    LIMIT 150
  `);
  return NextResponse.json(rows);
}
