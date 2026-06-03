import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mes  = Number(searchParams.get("mes"))  || new Date().getMonth() + 1;
  const anio = Number(searchParams.get("anio")) || new Date().getFullYear();

  const { rows } = await pool.query<{
    id: number; fecha: string; tipo: string; descripcion: string | null;
    lugar: string | null; es_capacitacion: boolean;
    hora_inicio: string | null; hora_fin: string | null;
    efectivos_asistentes: number; participantes: number;
    finalizado: boolean; reprogramada_de: number | null; area: string | null;
  }>(`
    SELECT a.id, a.fecha::text, a.tipo, a.descripcion, a.lugar,
           a.es_capacitacion, a.hora_inicio::text, a.hora_fin::text,
           a.efectivos_asistentes, a.entidad_id, e.nombre AS entidad_nombre,
           a.finalizado, a.reprogramada_de, a.area,
           COUNT(p.id)::int AS participantes
    FROM programacion_actividad a
    LEFT JOIN programacion_participante p ON p.actividad_id = a.id
    LEFT JOIN entidad e ON e.id = a.entidad_id
    WHERE EXTRACT(month FROM a.fecha) = $1 AND EXTRACT(year FROM a.fecha) = $2
    GROUP BY a.id, e.nombre
    ORDER BY a.fecha, a.hora_inicio
  `, [mes, anio]);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { fecha, tipo, descripcion, lugar, es_capacitacion, hora_inicio, hora_fin, participantes, entidad_id, area } = body;

  if (!fecha || !tipo) return NextResponse.json({ error: "Fecha y tipo son obligatorios" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: number }>(`
      INSERT INTO programacion_actividad (fecha, tipo, descripcion, lugar, es_capacitacion, hora_inicio, hora_fin, efectivos_asistentes, entidad_id, area)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [fecha, tipo, descripcion || null, lugar || null, es_capacitacion || false,
        hora_inicio || null, hora_fin || null,
        es_capacitacion ? (participantes?.length ?? 0) : (body.efectivos_asistentes ?? 0),
        entidad_id || null, area || null]);

    const actividadId = rows[0].id;

    if (es_capacitacion && Array.isArray(participantes) && participantes.length > 0) {
      for (const bomberoId of participantes) {
        await client.query(`
          INSERT INTO programacion_participante (actividad_id, bombero_id) VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [actividadId, bomberoId]);
      }
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: actividadId }, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: "Error al crear actividad" }, { status: 500 });
  } finally {
    client.release();
  }
}
