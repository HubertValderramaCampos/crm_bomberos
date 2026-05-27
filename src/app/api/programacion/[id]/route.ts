import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [actRes, partRes] = await Promise.all([
    pool.query<{
      id: number; fecha: string; tipo: string; descripcion: string | null;
      lugar: string | null; es_capacitacion: boolean;
      hora_inicio: string | null; hora_fin: string | null; efectivos_asistentes: number;
      entidad_nombre: string | null; finalizado: boolean; reprogramada_de: number | null;
    }>(`SELECT a.id, a.fecha::text, a.tipo, a.descripcion, a.lugar, a.es_capacitacion,
               a.hora_inicio::text, a.hora_fin::text, a.efectivos_asistentes,
               a.finalizado, a.reprogramada_de,
               e.nombre AS entidad_nombre
        FROM programacion_actividad a
        LEFT JOIN entidad e ON e.id = a.entidad_id
        WHERE a.id = $1`, [id]),

    pool.query<{ bombero_id: number; apellidos: string; nombres: string; grado: string; asistio: boolean | null }>(`
      SELECT p.bombero_id, b.apellidos, b.nombres, b.grado, p.asistio
      FROM programacion_participante p
      JOIN bombero b ON b.id = p.bombero_id
      WHERE p.actividad_id = $1
      ORDER BY b.apellidos
    `, [id]),
  ]);

  if (!actRes.rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ...actRes.rows[0], participantes: partRes.rows });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const esAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  if (!esAdmin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  // Acción: finalizar
  if (body.accion === "finalizar") {
    await pool.query(
      `UPDATE programacion_actividad SET finalizado = TRUE WHERE id = $1`,
      [id]
    );
    // Marcar solicitud vinculada como FINALIZADO si existe
    await pool.query(
      `UPDATE solicitud_capacitacion SET estado = 'FINALIZADO' WHERE actividad_id = $1`,
      [id]
    );

    // Generar 3 encuestas automáticas si la actividad tiene entidad vinculada
    const actRow = await pool.query<{
      entidad_id: number | null; descripcion: string | null; entidad_nombre: string | null;
    }>(`
      SELECT a.entidad_id, a.descripcion, e.nombre AS entidad_nombre
      FROM programacion_actividad a
      LEFT JOIN entidad e ON e.id = a.entidad_id
      WHERE a.id = $1
    `, [id]);

    const act = actRow.rows[0];
    if (act?.entidad_id) {
      const slug = act.entidad_nombre!
        .toLowerCase()
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 20);

      const tokens: string[] = [];
      for (let i = 0; i < 3; i++) {
        const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
        const token = `${slug}-${suffix}`;
        await pool.query(
          `INSERT INTO encuesta_token (entidad_id, token, descripcion) VALUES ($1, $2, $3)`,
          [act.entidad_id, token, act.descripcion ?? null]
        );
        tokens.push(token);
      }
      return NextResponse.json({ ok: true, encuestas_generadas: tokens });
    }

    return NextResponse.json({ ok: true });
  }

  // Acción: reprogramar — crea nueva actividad copiando la original con nueva fecha
  if (body.accion === "reprogramar") {
    const { nueva_fecha, hora_inicio, hora_fin, lugar } = body;
    if (!nueva_fecha) return NextResponse.json({ error: "nueva_fecha requerida" }, { status: 400 });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Obtener datos de la actividad original
      const { rows } = await client.query(
        `SELECT tipo, descripcion, es_capacitacion, efectivos_asistentes, entidad_id
         FROM programacion_actividad WHERE id = $1`,
        [id]
      );
      if (!rows[0]) { await client.query("ROLLBACK"); return NextResponse.json({ error: "No encontrado" }, { status: 404 }); }
      const orig = rows[0];

      // Crear actividad reprogramada
      const { rows: nueva } = await client.query<{ id: number }>(
        `INSERT INTO programacion_actividad
           (fecha, tipo, descripcion, lugar, es_capacitacion, hora_inicio, hora_fin,
            efectivos_asistentes, entidad_id, reprogramada_de)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          nueva_fecha, orig.tipo, orig.descripcion,
          lugar ?? orig.lugar ?? null,
          orig.es_capacitacion,
          hora_inicio ?? null, hora_fin ?? null,
          orig.efectivos_asistentes, orig.entidad_id ?? null,
          Number(id),
        ]
      );
      const nuevaId = nueva[0].id;

      // Copiar participantes
      const { rows: parts } = await client.query(
        `SELECT bombero_id FROM programacion_participante WHERE actividad_id = $1`, [id]
      );
      for (const p of parts) {
        await client.query(
          `INSERT INTO programacion_participante (actividad_id, bombero_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [nuevaId, p.bombero_id]
        );
      }

      // Marcar actividad original como reprogramada (finalizado=true para que no aparezca como vencida)
      await client.query(
        `UPDATE programacion_actividad SET finalizado = TRUE WHERE id = $1`, [id]
      );

      // Actualizar solicitud vinculada → REPROGRAMADO + nueva actividad_id
      await client.query(
        `UPDATE solicitud_capacitacion SET estado = 'REPROGRAMADO', actividad_id = $1
         WHERE actividad_id = $2`,
        [nuevaId, id]
      );

      await client.query("COMMIT");
      return NextResponse.json({ id: nuevaId });
    } catch {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Error al reprogramar" }, { status: 500 });
    } finally {
      client.release();
    }
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const esAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);
  if (!esAdmin) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  await pool.query(`DELETE FROM programacion_actividad WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
