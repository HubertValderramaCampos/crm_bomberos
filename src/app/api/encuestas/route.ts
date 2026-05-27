import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: listar todos los tokens con sus respuestas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { rows } = await pool.query<{
    id: number; token: string; activo: boolean; created_at: string;
    entidad_id: number; entidad_nombre: string;
    total_respuestas: number; ultima_respuesta: string | null;
  }>(`
    SELECT t.id, t.token::text, t.activo, t.created_at::text,
           e.id AS entidad_id, e.nombre AS entidad_nombre,
           COUNT(r.id)::int AS total_respuestas,
           MAX(r.created_at)::text AS ultima_respuesta
    FROM encuesta_token t
    JOIN entidad e ON e.id = t.entidad_id
    LEFT JOIN encuesta_respuesta r ON r.token_id = t.id
    GROUP BY t.id, e.id, e.nombre
    ORDER BY e.nombre, t.created_at DESC
  `);

  return NextResponse.json(rows);
}

// POST: crear token para una entidad
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { entidad_id } = await req.json();
  if (!entidad_id) return NextResponse.json({ error: "entidad_id requerido" }, { status: 400 });

  const { rows } = await pool.query<{ id: number; token: string }>(`
    INSERT INTO encuesta_token (entidad_id) VALUES ($1)
    RETURNING id, token::text
  `, [entidad_id]);

  return NextResponse.json(rows[0], { status: 201 });
}
