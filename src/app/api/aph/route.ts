import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: listar evaluaciones
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const esJefe = ROLES_JEFE.includes(session.user.rol);
  const bomberoId = session.user.bomberoId;

  // Solo jefe/admin pueden ver evaluaciones; evaluador ve las suyas
  if (!esJefe && !bomberoId)
    return NextResponse.json([]);

  const { rows } = await pool.query(`
    SELECT a.id, a.completada, a.fecha_asignacion::text,
           e.numero_parte, e.tipo AS emerg_tipo,
           DATE(e.created_at)::text AS emerg_fecha,
           ber.apellidos || ', ' || ber.nombres AS evaluador_nombre,
           COUNT(ev.id)::int AS total_evaluados,
           COUNT(ev.id) FILTER (WHERE ev.clasificacion_final IS NOT NULL)::int AS evaluados_completos,
           -- Promedio de puntaje % sobre todos los evaluados con al menos una sección
           ROUND(
             AVG(
               (
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_salida)        item), 0) +
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_escena)        item), 0) +
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_atencion_eval) item), 0) +
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_atencion_proc) item), 0) +
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_atencion_com)  item), 0) +
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_transporte)    item), 0) +
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_reacondiciona) item), 0) +
                 COALESCE((SELECT SUM((item->>'puntaje')::int) FROM jsonb_array_elements(ev.sec_documentacion) item), 0)
               )::float /
               NULLIF(
                 COALESCE(jsonb_array_length(ev.sec_salida),0) +
                 COALESCE(jsonb_array_length(ev.sec_escena),0) +
                 COALESCE(jsonb_array_length(ev.sec_atencion_eval),0) +
                 COALESCE(jsonb_array_length(ev.sec_atencion_proc),0) +
                 COALESCE(jsonb_array_length(ev.sec_atencion_com),0) +
                 COALESCE(jsonb_array_length(ev.sec_transporte),0) +
                 COALESCE(jsonb_array_length(ev.sec_reacondiciona),0) +
                 COALESCE(jsonb_array_length(ev.sec_documentacion),0), 0
               ) * 5.0 * 100
             )
           )::int AS pct_promedio
    FROM aph_evaluacion a
    JOIN emergencia e   ON e.id  = a.emergencia_id
    JOIN bombero ber    ON ber.id = a.evaluador_id
    LEFT JOIN aph_evaluado ev ON ev.evaluacion_id = a.id
    ${!esJefe ? "WHERE a.evaluador_id = $1" : ""}
    GROUP BY a.id, e.numero_parte, e.tipo, e.created_at, ber.apellidos, ber.nombres
    ORDER BY a.fecha_asignacion DESC
  `, !esJefe ? [bomberoId] : []);

  return NextResponse.json(rows);
}

// POST: crear nueva evaluación (solo jefe)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { emergencia_id, evaluador_id } = await req.json();
  if (!emergencia_id || !evaluador_id)
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO aph_evaluacion (emergencia_id, evaluador_id, creado_por)
       VALUES ($1, $2, $3) RETURNING id`,
      [emergencia_id, evaluador_id, Number(session.user.id)]
    );
    const evalId = rows[0].id;

    // Pre-insertar los efectivos nominales del parte como evaluados
    const efectivos = await client.query(
      `SELECT ee.bombero_id FROM emergencia_efectivo ee WHERE ee.emergencia_id = $1`,
      [emergencia_id]
    );
    for (const ef of efectivos.rows) {
      await client.query(
        `INSERT INTO aph_evaluado (evaluacion_id, bombero_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [evalId, ef.bombero_id]
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: evalId }, { status: 201 });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505")
      return NextResponse.json({ error: "Ya existe una evaluación para ese parte." }, { status: 409 });
    throw err;
  } finally {
    client.release();
  }
}
