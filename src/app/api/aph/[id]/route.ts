import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: obtener evaluación completa
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { rows } = await pool.query(`
    SELECT a.*,
           e.numero_parte, e.tipo AS emerg_tipo, e.direccion AS emerg_direccion,
           e.distrito AS emerg_distrito,
           DATE(e.created_at)::text AS emerg_fecha,
           e.fecha_despacho::text  AS emerg_hora_despacho,
           bev.apellidos || ', ' || bev.nombres AS evaluado_nombre,
           bev.grado AS evaluado_grado, bev.codigo AS evaluado_codigo,
           ber.apellidos || ', ' || ber.nombres AS evaluador_nombre,
           ber.grado AS evaluador_grado, ber.codigo AS evaluador_codigo,
           ber.id AS evaluador_bombero_id
    FROM aph_evaluacion a
    JOIN emergencia e   ON e.id  = a.emergencia_id
    JOIN bombero bev    ON bev.id = a.evaluado_id
    JOIN bombero ber    ON ber.id = a.evaluador_id
    WHERE a.id = $1
  `, [id]);

  if (!rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Verificar acceso: solo el evaluador o el jefe
  const bomberoId = session.user.bomberoId;
  const esJefe = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  if (!esJefe && rows[0].evaluador_bombero_id !== bomberoId)
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  return NextResponse.json(rows[0]);
}

// PUT: guardar/completar evaluación (solo el evaluador asignado)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // Verificar que sea el evaluador asignado o jefe
  const evalRow = await pool.query<{ evaluador_id: number; completada: boolean }>(
    `SELECT evaluador_id, completada FROM aph_evaluacion WHERE id = $1`, [id]
  );
  if (!evalRow.rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const esJefe = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  const esEvaluador = evalRow.rows[0].evaluador_id === session.user.bomberoId;
  if (!esJefe && !esEvaluador)
    return NextResponse.json({ error: "Solo el evaluador asignado puede completar esta evaluación" }, { status: 403 });

  const body = await req.json();
  const {
    hora_activacion, hora_salida, hora_llegada_escena, hora_traslado, hora_entrega_hosp,
    tipo_emergencia_desc, lugar_atencion,
    sec_salida, sec_escena, sec_atencion_eval, sec_atencion_proc,
    sec_atencion_com, sec_transporte, sec_reacondiciona, sec_documentacion,
    obs_generales, conclusiones, clasificacion_final, completada,
  } = body;

  await pool.query(`
    UPDATE aph_evaluacion SET
      hora_activacion = $1, hora_salida = $2, hora_llegada_escena = $3,
      hora_traslado = $4, hora_entrega_hosp = $5,
      tipo_emergencia_desc = $6, lugar_atencion = $7,
      sec_salida = $8, sec_escena = $9, sec_atencion_eval = $10,
      sec_atencion_proc = $11, sec_atencion_com = $12,
      sec_transporte = $13, sec_reacondiciona = $14, sec_documentacion = $15,
      obs_generales = $16, conclusiones = $17, clasificacion_final = $18,
      completada = $19,
      fecha_completada = CASE WHEN $19 = true THEN NOW() ELSE fecha_completada END
    WHERE id = $20
  `, [
    hora_activacion || null, hora_salida || null, hora_llegada_escena || null,
    hora_traslado || null, hora_entrega_hosp || null,
    tipo_emergencia_desc || null, lugar_atencion || null,
    sec_salida ? JSON.stringify(sec_salida) : null,
    sec_escena ? JSON.stringify(sec_escena) : null,
    sec_atencion_eval ? JSON.stringify(sec_atencion_eval) : null,
    sec_atencion_proc ? JSON.stringify(sec_atencion_proc) : null,
    sec_atencion_com ? JSON.stringify(sec_atencion_com) : null,
    sec_transporte ? JSON.stringify(sec_transporte) : null,
    sec_reacondiciona ? JSON.stringify(sec_reacondiciona) : null,
    sec_documentacion ? JSON.stringify(sec_documentacion) : null,
    obs_generales || null, conclusiones || null, clasificacion_final || null,
    completada ?? false, id,
  ]);

  return NextResponse.json({ ok: true });
}

// DELETE: eliminar evaluación (solo jefe)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  await pool.query(`DELETE FROM aph_evaluacion WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
