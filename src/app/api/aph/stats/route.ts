import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/aph/stats?anio=2026&mes=6
// Devuelve clasificaciones finales agrupadas por vehículo para el mes dado
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const anio = Number(searchParams.get("anio")) || new Date().getFullYear();
  const mes  = Number(searchParams.get("mes"))  || new Date().getMonth() + 1;

  try {
    // Evaluados completados en el mes, con vehículo de la emergencia
    const { rows } = await pool.query(`
      SELECT
        v.codigo                          AS vehiculo,
        ev.clasificacion_final            AS clasificacion,
        COUNT(*)::int                     AS total
      FROM aph_evaluado ev
      JOIN aph_evaluacion a   ON a.id  = ev.evaluacion_id
      JOIN emergencia e        ON e.id  = a.emergencia_id
      LEFT JOIN emergencia_vehiculo evh ON evh.emergencia_id = e.id
      LEFT JOIN vehiculo v              ON v.id = evh.vehiculo_id
      WHERE a.completada = true
        AND EXTRACT(year  FROM a.fecha_completada) = $1
        AND EXTRACT(month FROM a.fecha_completada) = $2
        AND ev.clasificacion_final IS NOT NULL
      GROUP BY v.codigo, ev.clasificacion_final
      ORDER BY v.codigo, ev.clasificacion_final
    `, [anio, mes]);

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/aph/stats]", err);
    return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
  }
}
