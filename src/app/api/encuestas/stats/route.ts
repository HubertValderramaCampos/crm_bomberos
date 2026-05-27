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

  // Construir filtro como CTE para reutilizarlo en todas las queries
  const filterParams: unknown[] = [];
  const filterConditions: string[] = [];
  if (tipoEntidad) { filterParams.push(tipoEntidad);       filterConditions.push(`e.tipo = $${filterParams.length}`); }
  if (entidadId)   { filterParams.push(Number(entidadId)); filterConditions.push(`e.id = $${filterParams.length}`); }
  const filterWhere = filterConditions.length ? filterConditions.join(" AND ") : "1=1";

  // CTE base: IDs de tokens que pasan el filtro
  const baseCteSql = `
    WITH token_ids AS (
      SELECT t.id AS token_id
      FROM encuesta_token t
      JOIN entidad e ON e.id = t.entidad_id
      WHERE ${filterWhere}
    )
  `;

  try {
    const [totalesRes, califRes, booleansRes, aspectosRes, porMesRes, porEntidadRes] = await Promise.all([

      pool.query<{ total_respuestas: number; total_tokens: number; total_entidades: number }>(`
        ${baseCteSql}
        SELECT
          COUNT(DISTINCT r.id)::int        AS total_respuestas,
          COUNT(DISTINCT t.id)::int        AS total_tokens,
          COUNT(DISTINCT t.entidad_id)::int AS total_entidades
        FROM token_ids ti
        JOIN encuesta_token t ON t.id = ti.token_id
        LEFT JOIN encuesta_respuesta r ON r.token_id = t.id
      `, filterParams),

      pool.query<{ campo: string; valor: string; cnt: number }>(`
        ${baseCteSql}
        SELECT campo, valor, COUNT(*)::int AS cnt
        FROM (
          SELECT 'contenido'    AS campo, contenido_calif          AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND contenido_calif IS NOT NULL
          UNION ALL
          SELECT 'materiales'   AS campo, materiales_calif         AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND materiales_calif IS NOT NULL
          UNION ALL
          SELECT 'dinamica'     AS campo, dinamica_expositores     AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND dinamica_expositores IS NOT NULL
          UNION ALL
          SELECT 'conocimiento' AS campo, conocimiento_expositores AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND conocimiento_expositores IS NOT NULL
        ) sub
        GROUP BY campo, valor
        ORDER BY campo, valor
      `, filterParams),

      pool.query<{ campo: string; si_count: number; no_count: number }>(`
        ${baseCteSql}
        SELECT
          campo,
          SUM(CASE WHEN valor = true  THEN 1 ELSE 0 END)::int AS si_count,
          SUM(CASE WHEN valor = false THEN 1 ELSE 0 END)::int AS no_count
        FROM (
          SELECT 'objetivos'    AS campo, objetivos_alcanzados AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND objetivos_alcanzados IS NOT NULL
          UNION ALL
          SELECT 'duracion'     AS campo, duracion_adecuada    AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND duracion_adecuada IS NOT NULL
          UNION ALL
          SELECT 'dinamicas'    AS campo, dinamicas_correctas  AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND dinamicas_correctas IS NOT NULL
          UNION ALL
          SELECT 'recomendaria' AS campo, recomendaria         AS valor FROM encuesta_respuesta WHERE token_id IN (SELECT token_id FROM token_ids) AND recomendaria IS NOT NULL
        ) sub
        GROUP BY campo
      `, filterParams),

      pool.query<{ aspecto: string; cnt: number }>(`
        ${baseCteSql}
        SELECT aspecto, COUNT(*)::int AS cnt
        FROM (
          SELECT UNNEST(aspectos_mejora) AS aspecto
          FROM encuesta_respuesta
          WHERE token_id IN (SELECT token_id FROM token_ids)
            AND aspectos_mejora IS NOT NULL
            AND array_length(aspectos_mejora, 1) > 0
        ) sub
        GROUP BY aspecto
        ORDER BY cnt DESC
        LIMIT 6
      `, filterParams),

      pool.query<{ mes: string; cnt: number }>(`
        ${baseCteSql}
        SELECT TO_CHAR(r.created_at, 'YYYY-MM') AS mes, COUNT(*)::int AS cnt
        FROM encuesta_respuesta r
        WHERE r.token_id IN (SELECT token_id FROM token_ids)
          AND r.created_at >= NOW() - INTERVAL '12 months'
        GROUP BY mes
        ORDER BY mes
      `, filterParams),

      pool.query<{ entidad_nombre: string; tipo: string; cnt: number }>(`
        ${baseCteSql}
        SELECT e.nombre AS entidad_nombre, e.tipo, COUNT(r.id)::int AS cnt
        FROM token_ids ti
        JOIN encuesta_token t ON t.id = ti.token_id
        JOIN entidad e ON e.id = t.entidad_id
        LEFT JOIN encuesta_respuesta r ON r.token_id = t.id
        GROUP BY e.id, e.nombre, e.tipo
        ORDER BY cnt DESC
        LIMIT 8
      `, filterParams),
    ]);

    return NextResponse.json({
      totales:        totalesRes.rows[0] ?? { total_respuestas: 0, total_tokens: 0, total_entidades: 0 },
      calificaciones: califRes.rows,
      booleanos:      booleansRes.rows,
      aspectos:       aspectosRes.rows,
      porMes:         porMesRes.rows,
      porEntidad:     porEntidadRes.rows,
    });
  } catch (err) {
    console.error("[encuestas/stats]", err);
    return NextResponse.json({ error: "Error al cargar estadísticas" }, { status: 500 });
  }
}
