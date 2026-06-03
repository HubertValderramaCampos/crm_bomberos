import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: detalle completo incluyendo evaluados
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [evalRes, evaluadosRes] = await Promise.all([
    pool.query(`
      SELECT a.*,
             e.numero_parte, e.tipo AS emerg_tipo, e.direccion AS emerg_direccion,
             e.distrito AS emerg_distrito,
             DATE(e.created_at)::text AS emerg_fecha,
             e.fecha_despacho::text  AS emerg_hora_despacho,
             ber.apellidos || ', ' || ber.nombres AS evaluador_nombre,
             ber.grado AS evaluador_grado, ber.codigo AS evaluador_codigo,
             ber.id AS evaluador_bombero_id
      FROM aph_evaluacion a
      JOIN emergencia e ON e.id  = a.emergencia_id
      JOIN bombero ber  ON ber.id = a.evaluador_id
      WHERE a.id = $1
    `, [id]),
    pool.query(`
      SELECT ev.*,
             b.apellidos, b.nombres, b.grado, b.codigo
      FROM aph_evaluado ev
      JOIN bombero b ON b.id = ev.bombero_id
      WHERE ev.evaluacion_id = $1
      ORDER BY b.apellidos
    `, [id]),
  ]);

  if (!evalRes.rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const eval_ = evalRes.rows[0];

  // Solo el evaluador asignado o el jefe pueden acceder
  const esJefe     = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  const esEvaluador = Number(eval_.evaluador_bombero_id) === Number(session.user.bomberoId);
  if (!esJefe && !esEvaluador)
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  return NextResponse.json({ ...eval_, evaluados: evaluadosRes.rows });
}

// PUT: guardar datos generales + lista de evaluados con sus secciones
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const evalRow = await pool.query<{ evaluador_id: number; completada: boolean }>(
    `SELECT evaluador_id, completada FROM aph_evaluacion WHERE id = $1`, [id]
  );
  if (!evalRow.rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const esJefe     = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  const esEvaluador = Number(evalRow.rows[0].evaluador_id) === Number(session.user.bomberoId);
  if (!esJefe && !esEvaluador)
    return NextResponse.json({ error: "Solo el evaluador asignado puede completar esta evaluación" }, { status: 403 });

  const body = await req.json();
  const {
    hora_activacion, hora_salida, hora_llegada_escena,
    hora_traslado, hora_entrega_hosp,
    tipo_emergencia_desc, lugar_atencion,
    evaluados, completada,
  } = body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Actualizar datos generales
    await client.query(`
      UPDATE aph_evaluacion SET
        hora_activacion=$1, hora_salida=$2, hora_llegada_escena=$3,
        hora_traslado=$4, hora_entrega_hosp=$5,
        tipo_emergencia_desc=$6, lugar_atencion=$7,
        completada=$8,
        fecha_completada = CASE WHEN $8=true THEN NOW() ELSE fecha_completada END
      WHERE id=$9
    `, [
      hora_activacion||null, hora_salida||null, hora_llegada_escena||null,
      hora_traslado||null, hora_entrega_hosp||null,
      tipo_emergencia_desc||null, lugar_atencion||null,
      completada??false, id,
    ]);

    // Upsert evaluados
    if (Array.isArray(evaluados)) {
      for (const ev of evaluados) {
        await client.query(`
          INSERT INTO aph_evaluado
            (evaluacion_id, bombero_id, sec_salida, sec_escena, sec_atencion_eval,
             sec_atencion_proc, sec_atencion_com, sec_transporte,
             sec_reacondiciona, sec_documentacion,
             obs_generales, conclusiones, clasificacion_final)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT (evaluacion_id, bombero_id) DO UPDATE SET
            sec_salida=$3, sec_escena=$4, sec_atencion_eval=$5,
            sec_atencion_proc=$6, sec_atencion_com=$7, sec_transporte=$8,
            sec_reacondiciona=$9, sec_documentacion=$10,
            obs_generales=$11, conclusiones=$12, clasificacion_final=$13
        `, [
          id, ev.bombero_id,
          ev.sec_salida        ? JSON.stringify(ev.sec_salida)        : null,
          ev.sec_escena        ? JSON.stringify(ev.sec_escena)        : null,
          ev.sec_atencion_eval ? JSON.stringify(ev.sec_atencion_eval) : null,
          ev.sec_atencion_proc ? JSON.stringify(ev.sec_atencion_proc) : null,
          ev.sec_atencion_com  ? JSON.stringify(ev.sec_atencion_com)  : null,
          ev.sec_transporte    ? JSON.stringify(ev.sec_transporte)    : null,
          ev.sec_reacondiciona ? JSON.stringify(ev.sec_reacondiciona) : null,
          ev.sec_documentacion ? JSON.stringify(ev.sec_documentacion) : null,
          ev.obs_generales||null, ev.conclusiones||null, ev.clasificacion_final||null,
        ]);
      }

      // Eliminar evaluados que se quitaron de la lista
      const ids = evaluados.map((e: { bombero_id: number }) => e.bombero_id);
      if (ids.length > 0) {
        await client.query(
          `DELETE FROM aph_evaluado WHERE evaluacion_id=$1 AND bombero_id != ALL($2)`,
          [id, ids]
        );
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[PUT /api/aph/id]", err);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  } finally {
    client.release();
  }
}

// DELETE: solo jefe
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  await pool.query(`DELETE FROM aph_evaluacion WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
