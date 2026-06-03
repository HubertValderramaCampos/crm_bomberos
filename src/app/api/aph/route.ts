import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: listar evaluaciones (jefe ve todas, evaluador ve las suyas)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const esJefe = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  const bomberoId = session.user.bomberoId;

  let rows;
  if (esJefe) {
    ({ rows } = await pool.query(`
      SELECT a.id, a.completada, a.fecha_asignacion::text,
             a.clasificacion_final,
             e.numero_parte, e.tipo AS emerg_tipo,
             DATE(e.created_at)::text AS emerg_fecha,
             bev.apellidos || ', ' || bev.nombres AS evaluado_nombre, bev.grado AS evaluado_grado,
             ber.apellidos || ', ' || ber.nombres AS evaluador_nombre,
             a.sec_salida, a.sec_escena, a.sec_atencion_eval, a.sec_atencion_proc,
             a.sec_atencion_com, a.sec_transporte, a.sec_reacondiciona, a.sec_documentacion
      FROM aph_evaluacion a
      JOIN emergencia e ON e.id = a.emergencia_id
      JOIN bombero bev ON bev.id = a.evaluado_id
      JOIN bombero ber ON ber.id = a.evaluador_id
      ORDER BY a.fecha_asignacion DESC
    `));
  } else {
    if (!bomberoId) return NextResponse.json([]);
    ({ rows } = await pool.query(`
      SELECT a.id, a.completada, a.fecha_asignacion::text,
             a.clasificacion_final,
             e.numero_parte, e.tipo AS emerg_tipo,
             DATE(e.created_at)::text AS emerg_fecha,
             bev.apellidos || ', ' || bev.nombres AS evaluado_nombre, bev.grado AS evaluado_grado,
             ber.apellidos || ', ' || ber.nombres AS evaluador_nombre,
             a.sec_salida, a.sec_escena, a.sec_atencion_eval, a.sec_atencion_proc,
             a.sec_atencion_com, a.sec_transporte, a.sec_reacondiciona, a.sec_documentacion
      FROM aph_evaluacion a
      JOIN emergencia e ON e.id = a.emergencia_id
      JOIN bombero bev ON bev.id = a.evaluado_id
      JOIN bombero ber ON ber.id = a.evaluador_id
      WHERE a.evaluador_id = $1
      ORDER BY a.fecha_asignacion DESC
    `, [bomberoId]));
  }
  return NextResponse.json(rows);
}

// POST: crear nueva evaluación (solo jefe)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { emergencia_id, evaluador_id, evaluado_id } = await req.json();
  if (!emergencia_id || !evaluador_id || !evaluado_id)
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });

  try {
    const { rows } = await pool.query(
      `INSERT INTO aph_evaluacion (emergencia_id, evaluador_id, evaluado_id, creado_por)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [emergencia_id, evaluador_id, evaluado_id, Number(session.user.id)]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505")
      return NextResponse.json({ error: "Ya existe una evaluación para ese parte y evaluado." }, { status: 409 });
    throw err;
  }
}
