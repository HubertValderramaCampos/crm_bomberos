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
        a.id,
        a.fecha::text                                                              AS fecha,
        a.tipo,
        a.descripcion                                                              AS tema,
        a.lugar,
        e.nombre                                                                   AS entidad,
        a.hora_inicio::text,
        a.hora_fin::text,
        MAX(b.apellidos || ', ' || b.nombres) FILTER (WHERE pp.es_instructor = true) AS instructor_nombre,
        MAX(b.grado)                           FILTER (WHERE pp.es_instructor = true) AS instructor_grado,
        COUNT(pp.bombero_id)::int                                                  AS total_convocados,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio = true)::int                AS asistieron,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio = false)::int               AS no_asistieron,
        COUNT(pp.bombero_id) FILTER (WHERE pp.asistio IS NULL)::int               AS sin_marcar,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'bombero_id',    pp.bombero_id,
            'apellidos',     b.apellidos,
            'nombres',       b.nombres,
            'grado',         b.grado,
            'asistio',       pp.asistio,
            'es_instructor', pp.es_instructor
          ) ORDER BY b.apellidos
        ) FILTER (WHERE pp.bombero_id IS NOT NULL)                                AS participantes
      FROM programacion_actividad a
      LEFT JOIN entidad e                    ON e.id  = a.entidad_id
      LEFT JOIN programacion_participante pp ON pp.actividad_id = a.id
      LEFT JOIN bombero b                    ON b.id  = pp.bombero_id
      WHERE a.es_capacitacion = true
        AND a.tipo = 'Capacitación interna'
        AND (a.finalizado = true OR a.fecha < CURRENT_DATE)
        AND EXTRACT(year FROM a.fecha) = $1
      GROUP BY a.id, a.fecha, a.tipo, a.descripcion, a.lugar, e.nombre, a.hora_inicio, a.hora_fin
      ORDER BY a.fecha DESC
    `, [anio]);

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET cursos-detalle]", err);
    return NextResponse.json({ error: "Error al cargar cursos" }, { status: 500 });
  }
}
