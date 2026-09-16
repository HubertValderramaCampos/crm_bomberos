import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fechaLima } from "@/lib/fechaLima";
import { puedeEditarEvaluacionPractica } from "@/lib/evaluacionPracticaAuth";
import { CRITERIOS_EVAL_PRACTICA, SECCIONES_EVAL_PRACTICA, TIPOS_PRACTICA } from "@/lib/evaluacionPracticaCatalogo";
import pool from "@/lib/db";

// GET: listar evaluaciones — visible para todos los usuarios autenticados
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT ep.id, ep.fecha::text, ep.hora, ep.lugar, ep.tipo_practica, ep.created_at,
           u.codigo AS creado_por_codigo, b.apellidos, b.nombres,
           COUNT(epi.id) FILTER (WHERE epi.respuesta = 'SI')::int AS si_count,
           COUNT(epi.id)::int AS total_items
    FROM evaluacion_practica ep
    JOIN usuario u ON u.id = ep.creado_por
    LEFT JOIN bombero b ON b.id = u.bombero_id
    LEFT JOIN evaluacion_practica_item epi ON epi.evaluacion_id = ep.id
    GROUP BY ep.id, u.codigo, b.apellidos, b.nombres
    ORDER BY ep.fecha DESC, ep.created_at DESC
  `);

  return NextResponse.json(rows);
}

// POST: crear nueva evaluación (solo Operaciones, Jefes o editores autorizados)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const autorizado = await puedeEditarEvaluacionPractica(session.user.id, session.user.rol);
  if (!autorizado) return NextResponse.json({ error: "No tienes permiso para llenar evaluaciones" }, { status: 403 });

  const body = await req.json();
  const fecha = body.fecha || fechaLima();
  const hora: string | null = body.hora || null;
  const lugar: string | null = body.lugar || null;
  const tipoPractica: string = body.tipoPractica;

  if (!tipoPractica || !(TIPOS_PRACTICA as readonly string[]).includes(tipoPractica)) {
    return NextResponse.json({ error: "Tipo de práctica inválido" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO evaluacion_practica (fecha, hora, lugar, tipo_practica, creado_por)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [fecha, hora, lugar, tipoPractica, Number(session.user.id)]
    );
    const evaluacionId = rows[0].id;

    const values: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    for (const seccion of SECCIONES_EVAL_PRACTICA) {
      CRITERIOS_EVAL_PRACTICA[seccion].forEach((descripcion, idx) => {
        values.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
        params.push(evaluacionId, seccion, idx + 1, descripcion);
      });
    }
    await client.query(
      `INSERT INTO evaluacion_practica_item (evaluacion_id, seccion, orden, descripcion) VALUES ${values.join(", ")}`,
      params
    );

    await client.query("COMMIT");
    return NextResponse.json({ id: evaluacionId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[POST /api/evaluacion-practica]", err);
    return NextResponse.json({ error: "Error al crear la evaluación" }, { status: 500 });
  } finally {
    client.release();
  }
}
