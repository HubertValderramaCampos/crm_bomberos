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
    descripcion: string | null;
    total_respuestas: number; ultima_respuesta: string | null;
  }>(`
    SELECT t.id, t.token, t.activo, t.created_at::text,
           t.descripcion,
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

function slugNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // quitar tildes
    .replace(/[^a-z0-9]+/g, "-")                      // espacios/símbolos → guión
    .replace(/^-+|-+$/g, "")                           // trim guiones
    .slice(0, 20);                                      // máximo 20 chars
}

// POST: crear token para una entidad
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { entidad_id, descripcion } = await req.json();
  if (!entidad_id) return NextResponse.json({ error: "entidad_id requerido" }, { status: 400 });

  // Obtener nombre de la entidad para el slug
  const entRes = await pool.query<{ nombre: string }>(`SELECT nombre FROM entidad WHERE id = $1`, [entidad_id]);
  if (!entRes.rows.length) return NextResponse.json({ error: "Entidad no encontrada" }, { status: 404 });

  const slug = slugNombre(entRes.rows[0].nombre);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const token = `${slug}-${suffix}`;

  const { rows } = await pool.query<{ id: number }>(`
    INSERT INTO encuesta_token (entidad_id, token, descripcion) VALUES ($1, $2, $3)
    RETURNING id
  `, [entidad_id, token, descripcion ?? null]);

  return NextResponse.json({ id: rows[0].id, token }, { status: 201 });
}
