import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const TIPO = "Proyección social";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query<{
    id: number; fecha: string; descripcion: string | null;
    lugar: string | null; hora_inicio: string | null; hora_fin: string | null;
    finalizado: boolean;
  }>(`
    SELECT id, fecha::text, descripcion, lugar,
           hora_inicio::text, hora_fin::text, finalizado
    FROM programacion_actividad
    WHERE tipo = $1
    ORDER BY fecha DESC, hora_inicio
  `, [TIPO]);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { fecha, descripcion, lugar, hora_inicio, hora_fin } = await req.json();
  if (!fecha) return NextResponse.json({ error: "Fecha requerida" }, { status: 400 });

  const { rows } = await pool.query<{ id: number }>(`
    INSERT INTO programacion_actividad (fecha, tipo, descripcion, lugar, hora_inicio, hora_fin, es_capacitacion, efectivos_asistentes)
    VALUES ($1, $2, $3, $4, $5, $6, false, 0)
    RETURNING id
  `, [fecha, TIPO, descripcion || null, lugar || null, hora_inicio || null, hora_fin || null]);

  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
