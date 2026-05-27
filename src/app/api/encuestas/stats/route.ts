import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tipoEntidad = searchParams.get("tipo") ?? "";
  const entidadId   = searchParams.get("entidad_id") ?? "";

  const where: string[] = [];
  const params: unknown[] = [];

  if (tipoEntidad) { params.push(tipoEntidad);  where.push(`e.tipo = $${params.length}`); }
  if (entidadId)   { params.push(Number(entidadId)); where.push(`e.id = $${params.length}`); }

  const whereClause = where.length ? `AND ${where.join(" AND ")}` : "";

  // Totales globales
  const [totalesRes, califRes, booleansRes, aspectosRes, porMesRes, porEntidadRes] = await Promise.all([

    pool.query<{ total_respuestas: number; total_tokens: number; total_entidades: number }>(`
      SELECT
        COUNT(DISTINCT r.id)::int           AS total_respuestas,
        COUNT(DISTINCT t.id)::int           AS total_tokens,
        COUNT(DISTINCT e.id)::int           AS total_entidades
      FROM encuesta_token t
      JOIN entidad e ON e.id = t.entidad_id
      LEFT JOIN encuesta_respuesta r ON r.token_id = t.id
      WHERE 1=1 ${whereClause}
    `, params),

    // Promedios de calificaciones (excelente/bueno/regular/malo)
    pool.query<{ campo: string; valor: string; cnt: number }>(`
      SELECT campo, valor, COUNT(*)::int AS cnt
      FROM (
        SELECT 'contenido'   AS campo, r.contenido_calif   AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.contenido_calif IS NOT NULL   ${whereClause}
        UNION ALL
        SELECT 'materiales'  AS campo, r.materiales_calif  AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.materiales_calif IS NOT NULL  ${whereClause}
        UNION ALL
        SELECT 'dinamica'    AS campo, r.dinamica_expositores AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.dinamica_expositores IS NOT NULL ${whereClause}
        UNION ALL
        SELECT 'conocimiento' AS campo, r.conocimiento_expositores AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.conocimiento_expositores IS NOT NULL ${whereClause}
      ) sub
      GROUP BY campo, valor
      ORDER BY campo, valor
    `, params),

    // Porcentaje sí/no de preguntas booleanas
    pool.query<{ campo: string; si_count: number; no_count: number }>(`
      SELECT
        campo,
        SUM(CASE WHEN valor THEN 1 ELSE 0 END)::int AS si_count,
        SUM(CASE WHEN NOT valor THEN 1 ELSE 0 END)::int AS no_count
      FROM (
        SELECT 'objetivos'  AS campo, r.objetivos_alcanzados  AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.objetivos_alcanzados IS NOT NULL  ${whereClause}
        UNION ALL
        SELECT 'duracion'   AS campo, r.duracion_adecuada     AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.duracion_adecuada IS NOT NULL     ${whereClause}
        UNION ALL
        SELECT 'dinamicas'  AS campo, r.dinamicas_correctas   AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.dinamicas_correctas IS NOT NULL   ${whereClause}
        UNION ALL
        SELECT 'recomendaria' AS campo, r.recomendaria        AS valor FROM encuesta_respuesta r JOIN encuesta_token t ON t.id = r.token_id JOIN entidad e ON e.id = t.entidad_id WHERE r.recomendaria IS NOT NULL          ${whereClause}
      ) sub
      GROUP BY campo
    `, params),

    // Aspectos a mejorar más frecuentes
    pool.query<{ aspecto: string; cnt: number }>(`
      SELECT aspecto, COUNT(*)::int AS cnt
      FROM (
        SELECT UNNEST(r.aspectos_mejora) AS aspecto
        FROM encuesta_respuesta r
        JOIN encuesta_token t ON t.id = r.token_id
        JOIN entidad e ON e.id = t.entidad_id
        WHERE r.aspectos_mejora IS NOT NULL AND array_length(r.aspectos_mejora, 1) > 0
        ${whereClause}
      ) sub
      GROUP BY aspecto
      ORDER BY cnt DESC
      LIMIT 6
    `, params),

    // Respuestas por mes (últimos 12 meses)
    pool.query<{ mes: string; cnt: number }>(`
      SELECT TO_CHAR(r.created_at, 'YYYY-MM') AS mes, COUNT(*)::int AS cnt
      FROM encuesta_respuesta r
      JOIN encuesta_token t ON t.id = r.token_id
      JOIN entidad e ON e.id = t.entidad_id
      WHERE r.created_at >= NOW() - INTERVAL '12 months'
      ${whereClause}
      GROUP BY mes
      ORDER BY mes
    `, params),

    // Respuestas por entidad (top 8)
    pool.query<{ entidad_nombre: string; tipo: string; cnt: number }>(`
      SELECT e.nombre AS entidad_nombre, e.tipo, COUNT(r.id)::int AS cnt
      FROM encuesta_token t
      JOIN entidad e ON e.id = t.entidad_id
      LEFT JOIN encuesta_respuesta r ON r.token_id = t.id
      WHERE 1=1 ${whereClause}
      GROUP BY e.id, e.nombre, e.tipo
      ORDER BY cnt DESC
      LIMIT 8
    `, params),
  ]);

  return NextResponse.json({
    totales:     totalesRes.rows[0],
    calificaciones: califRes.rows,
    booleanos:   booleansRes.rows,
    aspectos:    aspectosRes.rows,
    porMes:      porMesRes.rows,
    porEntidad:  porEntidadRes.rows,
  });
}
