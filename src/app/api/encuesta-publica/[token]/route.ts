import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: validar token y obtener nombre de entidad (público, sin login)
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { rows } = await pool.query<{
    id: number; entidad_nombre: string; activo: boolean;
    actividad_fecha: string | null; actividad_hora_inicio: string | null;
    actividad_hora_fin: string | null;
  }>(`
    SELECT t.id, e.nombre AS entidad_nombre, t.activo,
           a.fecha::text          AS actividad_fecha,
           a.hora_inicio::text    AS actividad_hora_inicio,
           a.hora_fin::text       AS actividad_hora_fin
    FROM encuesta_token t
    JOIN entidad e ON e.id = t.entidad_id
    LEFT JOIN programacion_actividad a ON a.id = t.actividad_id
    WHERE t.token::text = $1
  `, [token]);

  if (!rows.length) return NextResponse.json({ error: "Enlace inválido" }, { status: 404 });
  if (!rows[0].activo) return NextResponse.json({ error: "Este enlace ya no está activo" }, { status: 410 });

  return NextResponse.json({
    entidad_nombre:       rows[0].entidad_nombre,
    actividad_fecha:      rows[0].actividad_fecha,
    actividad_hora_inicio: rows[0].actividad_hora_inicio,
    actividad_hora_fin:   rows[0].actividad_hora_fin,
  });
}

// POST: enviar respuesta (público, sin login)
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const tokenRow = await pool.query<{ id: number; activo: boolean }>(`
    SELECT id, activo FROM encuesta_token WHERE token::text = $1
  `, [token]);

  if (!tokenRow.rows.length) return NextResponse.json({ error: "Enlace inválido" }, { status: 404 });
  if (!tokenRow.rows[0].activo) return NextResponse.json({ error: "Enlace inactivo" }, { status: 410 });

  const tokenId = tokenRow.rows[0].id;
  const body = await req.json();

  const {
    empresa_nombre, horario, fecha_capacitacion,
    objetivos_alcanzados, duracion_adecuada, dinamicas_correctas,
    aspectos_mejora, contenido_calif, materiales_calif,
    dinamica_expositores, conocimiento_expositores,
    recomendaria, comentarios,
  } = body;

  await pool.query(`
    INSERT INTO encuesta_respuesta (
      token_id, empresa_nombre, horario, fecha_capacitacion,
      objetivos_alcanzados, duracion_adecuada, dinamicas_correctas,
      aspectos_mejora, contenido_calif, materiales_calif,
      dinamica_expositores, conocimiento_expositores,
      recomendaria, comentarios
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  `, [
    tokenId,
    empresa_nombre ?? null,
    horario ?? null,
    fecha_capacitacion ?? null,
    objetivos_alcanzados ?? null,
    duracion_adecuada ?? null,
    dinamicas_correctas ?? null,
    aspectos_mejora ?? null,
    contenido_calif ?? null,
    materiales_calif ?? null,
    dinamica_expositores ?? null,
    conocimiento_expositores ?? null,
    recomendaria ?? null,
    comentarios ?? null,
  ]);

  return NextResponse.json({ ok: true }, { status: 201 });
}
