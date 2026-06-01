import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: buscar capacitaciones para selector de encuestas
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const { rows } = await pool.query<{
    id: number; fecha: string; descripcion: string | null; tipo: string;
    entidad_id: number | null; entidad_nombre: string | null;
    lugar: string | null; tiene_encuesta: boolean;
  }>(`
    SELECT a.id, a.fecha::text, a.descripcion, a.tipo,
           a.entidad_id, e.nombre AS entidad_nombre, a.lugar,
           EXISTS (
             SELECT 1 FROM encuesta_token t
             WHERE t.actividad_id = a.id AND t.activo = true
           ) AS tiene_encuesta
    FROM programacion_actividad a
    LEFT JOIN entidad e ON e.id = a.entidad_id
    WHERE (a.es_capacitacion = true OR a.tipo ILIKE '%capacit%')
      AND ($1 = '' OR a.descripcion ILIKE $2 OR e.nombre ILIKE $2)
    ORDER BY a.fecha DESC
    LIMIT 20
  `, [q, `%${q}%`]);

  return NextResponse.json(rows);
}

// POST: crear capacitación rápida desde el formulario de encuestas
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { descripcion, fecha, entidad_id, lugar } = await req.json();
  if (!descripcion || !fecha)
    return NextResponse.json({ error: "Descripción y fecha son obligatorias" }, { status: 400 });

  const { rows } = await pool.query<{ id: number; entidad_nombre: string | null }>(`
    INSERT INTO programacion_actividad
      (fecha, tipo, descripcion, lugar, es_capacitacion, efectivos_asistentes, entidad_id)
    VALUES ($1, 'Capacitación externa', $2, $3, true, 0, $4)
    RETURNING id,
      (SELECT nombre FROM entidad WHERE id = $4) AS entidad_nombre
  `, [fecha, descripcion, lugar ?? null, entidad_id ?? null]);

  return NextResponse.json(rows[0], { status: 201 });
}
