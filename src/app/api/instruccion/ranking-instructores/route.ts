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
    // Ranking real: bomberos con es_instructor = true en capacitaciones finalizadas
    const { rows } = await pool.query(`
      SELECT
        b.id,
        b.apellidos,
        b.nombres,
        b.grado,
        b.codigo,
        COUNT(*)::int      AS total_capacitaciones,
        MAX(a.fecha)::text AS ultima_fecha
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

    if (rows.length > 0) {
      return NextResponse.json({ data: rows, sintetico: false });
    }

    // Sin data real → generar ranking sintético con los primeros bomberos activos
    const { rows: bomberos } = await pool.query(`
      SELECT id, apellidos, nombres, grado, codigo
      FROM bombero WHERE activo = true ORDER BY apellidos LIMIT 10
    `);

    if (bomberos.length === 0) {
      return NextResponse.json({ data: [], sintetico: false });
    }

    // Asignar conteos decrecientes simulados
    const MESES = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
    const sintetico = bomberos.slice(0, Math.min(8, bomberos.length)).map((b, i) => ({
      id:                  b.id,
      apellidos:           b.apellidos,
      nombres:             b.nombres,
      grado:               b.grado,
      codigo:              b.codigo,
      total_capacitaciones: Math.max(1, 6 - i),
      ultima_fecha:        `${anio}-${String(6 - (i % 6)).padStart(2, "0")}-15`,
    }));

    return NextResponse.json({ data: sintetico, sintetico: true });
  } catch (err) {
    console.error("[GET ranking-instructores]", err);
    return NextResponse.json({ error: "Error al cargar ranking" }, { status: 500 });
  }
}
