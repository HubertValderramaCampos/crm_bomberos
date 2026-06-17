import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const anio = Number(searchParams.get("anio")) || new Date().getFullYear();

  try {
    const { rows } = await pool.query(`
      SELECT
        b.id,
        b.apellidos,
        b.nombres,
        b.grado,
        b.codigo,
        COUNT(*)::int        AS total_capacitaciones,
        MAX(a.fecha)::text   AS ultima_fecha
      FROM programacion_participante p
      JOIN programacion_actividad a ON a.id = p.actividad_id
      JOIN bombero b                ON b.id = p.bombero_id
      WHERE p.es_instructor = true
        AND a.finalizado    = true
        AND EXTRACT(year FROM a.fecha) = $1
      GROUP BY b.id, b.apellidos, b.nombres, b.grado, b.codigo
      ORDER BY total_capacitaciones DESC, b.apellidos
      LIMIT 50
    `, [anio]);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET ranking-instructores]", err);
    return NextResponse.json({ error: "Error al cargar ranking" }, { status: 500 });
  }
}
