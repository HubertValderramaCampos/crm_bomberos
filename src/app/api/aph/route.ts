import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: listar evaluaciones
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const esJefe = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
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
           COUNT(ev.id) FILTER (WHERE ev.clasificacion_final IS NOT NULL)::int AS evaluados_completos
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
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { emergencia_id, evaluador_id } = await req.json();
  if (!emergencia_id || !evaluador_id)
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });

  try {
    const { rows } = await pool.query(
      `INSERT INTO aph_evaluacion (emergencia_id, evaluador_id, creado_por)
       VALUES ($1, $2, $3) RETURNING id`,
      [emergencia_id, evaluador_id, Number(session.user.id)]
    );
    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505")
      return NextResponse.json({ error: "Ya existe una evaluación para ese parte." }, { status: 409 });
    throw err;
  }
}
