import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolGuardia } from "@/lib/roles";
import { ahoraLima, fechaLima, horaLima } from "@/lib/fechaLima";
import pool from "@/lib/db";

const HORA_LIMITE = 23; // 11pm hora de Lima

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fechaParam = searchParams.get("fecha");
  const fecha = fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : fechaLima();
  const esHoy = fecha === fechaLima();
  const puedeAdministrar = esRolGuardia(session.user.rol);

  const [pools, solicitudes] = await Promise.all([
    pool.query<{ pool: string; capacidad: number }>(
      `SELECT pool, capacidad FROM guardia_nocturna_pool ORDER BY pool`
    ),
    pool.query(`
      SELECT gs.id, gs.bombero_id, gs.pool, gs.estado, gs.solicitado_en, gs.resuelto_en, gs.nota,
             b.codigo, b.grado, b.apellidos, b.nombres
      FROM guardia_nocturna_solicitud gs
      JOIN bombero b ON b.id = gs.bombero_id
      WHERE gs.fecha = $1
      ORDER BY gs.solicitado_en ASC
    `, [fecha]),
  ]);

  const miSolicitud = session.user.bomberoId
    ? solicitudes.rows.find(s => s.bombero_id === session.user.bomberoId) ?? null
    : null;

  let miSexo: string | null = null;
  if (session.user.bomberoId) {
    const r = await pool.query<{ sexo: string | null }>(`SELECT sexo FROM bombero WHERE id = $1`, [session.user.bomberoId]);
    miSexo = r.rows[0]?.sexo ?? null;
  }

  let sinSolicitud: unknown[] = [];
  if (puedeAdministrar && esHoy && horaLima(ahoraLima()) >= HORA_LIMITE) {
    const r = await pool.query(`
      SELECT DISTINCT b.id, b.codigo, b.grado, b.apellidos, b.nombres
      FROM asistencia_turno at
      JOIN bombero b ON b.id = at.bombero_id
      WHERE at.estado_compania_id = (SELECT id FROM estado_compania ORDER BY created_at DESC LIMIT 1)
        AND at.bombero_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM guardia_nocturna_solicitud gs
          WHERE gs.bombero_id = at.bombero_id AND gs.fecha = $1 AND gs.estado IN ('PENDIENTE','APROBADA')
        )
      ORDER BY b.apellidos
    `, [fecha]);
    sinSolicitud = r.rows;
  }

  return NextResponse.json({
    fecha,
    pools: pools.rows,
    solicitudes: solicitudes.rows,
    miSolicitud,
    miSexo,
    puedeAdministrar,
    sinSolicitud,
    horaLimiteAlcanzada: esHoy && horaLima(ahoraLima()) >= HORA_LIMITE,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!session.user.bomberoId) {
    return NextResponse.json({ error: "Solo un efectivo puede solicitar guardia" }, { status: 403 });
  }

  const ahora = ahoraLima();
  if (horaLima(ahora) >= HORA_LIMITE) {
    return NextResponse.json({ error: "Ya pasó el horario límite (11pm) para pedir guardia de hoy" }, { status: 400 });
  }
  const hoy = fechaLima(ahora);

  let body: { sexo?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const client = await pool.connect();
  try {
    const { rows: bRows } = await client.query<{ sexo: string | null }>(
      `SELECT sexo FROM bombero WHERE id = $1`, [session.user.bomberoId]
    );
    let sexo = bRows[0]?.sexo ?? null;

    if (!sexo) {
      if (body.sexo !== "M" && body.sexo !== "F") {
        return NextResponse.json({ error: "FALTA_SEXO" }, { status: 400 });
      }
      sexo = body.sexo;
      await client.query(`UPDATE bombero SET sexo = $1 WHERE id = $2`, [sexo, session.user.bomberoId]);
    }

    const poolDestino = sexo === "M" ? "MASCULINA" : "FEMENINA";

    const { rows } = await client.query(`
      INSERT INTO guardia_nocturna_solicitud (bombero_id, fecha, pool, estado, solicitado_en)
      VALUES ($1, $2, $3, 'PENDIENTE', NOW())
      ON CONFLICT (bombero_id, fecha) DO UPDATE SET
        pool = EXCLUDED.pool,
        estado = 'PENDIENTE',
        solicitado_en = NOW(),
        resuelto_en = NULL,
        resuelto_por = NULL,
        nota = NULL
      RETURNING id, pool, estado
    `, [session.user.bomberoId, hoy, poolDestino]);

    return NextResponse.json(rows[0], { status: 201 });
  } finally {
    client.release();
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!session.user.bomberoId) {
    return NextResponse.json({ error: "Solo un efectivo puede cancelar su guardia" }, { status: 403 });
  }

  const hoy = fechaLima();
  await pool.query(
    `UPDATE guardia_nocturna_solicitud SET estado = 'CANCELADA' WHERE bombero_id = $1 AND fecha = $2`,
    [session.user.bomberoId, hoy]
  );
  return NextResponse.json({ ok: true });
}
