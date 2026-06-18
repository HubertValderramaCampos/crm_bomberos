import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: obtener participantes de una actividad con su asistencia actual
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const { rows } = await pool.query<{
    bombero_id: number; apellidos: string; nombres: string; grado: string; codigo: string;
    asistio: boolean | null; justificacion: string | null; agregado_al_finalizar: boolean;
  }>(`
    SELECT p.bombero_id, b.apellidos, b.nombres, b.grado, b.codigo,
           p.asistio, p.justificacion, p.agregado_al_finalizar
    FROM programacion_participante p
    JOIN bombero b ON b.id = p.bombero_id
    WHERE p.actividad_id = $1
    ORDER BY b.apellidos
  `, [id]);

  return NextResponse.json(rows);
}

// PUT: guardar asistencia de todos los participantes
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol) && session.user.rol !== "INSTRUCCION")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const participantes: {
    bombero_id: number; asistio: boolean; justificacion: string | null; agregado: boolean; es_instructor?: boolean;
  }[] = await req.json();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const p of participantes) {
      const esInstructor = p.es_instructor ?? false;
      if (p.agregado) {
        await client.query(`
          INSERT INTO programacion_participante (actividad_id, bombero_id, asistio, justificacion, agregado_al_finalizar, es_instructor)
          VALUES ($1, $2, $3, $4, true, $5)
          ON CONFLICT (actividad_id, bombero_id)
          DO UPDATE SET asistio = $3, justificacion = $4, agregado_al_finalizar = true, es_instructor = $5
        `, [id, p.bombero_id, p.asistio, p.justificacion ?? null, esInstructor]);
      } else {
        await client.query(`
          UPDATE programacion_participante
          SET asistio = $1, justificacion = $2, es_instructor = $3
          WHERE actividad_id = $4 AND bombero_id = $5
        `, [p.asistio, p.justificacion ?? null, esInstructor, id, p.bombero_id]);
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[PUT asistencia]", err);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  } finally {
    client.release();
  }
}
