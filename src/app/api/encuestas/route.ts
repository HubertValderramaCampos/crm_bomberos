import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: listar todos los tokens con sus respuestas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { rows } = await pool.query<{
    id: number; token: string; activo: boolean; created_at: string;
    entidad_id: number; entidad_nombre: string;
    descripcion: string | null; actividad_id: number | null;
    actividad_fecha: string | null; actividad_desc: string | null;
    total_respuestas: number; ultima_respuesta: string | null;
  }>(`
    SELECT t.id, t.token, t.activo, t.created_at::text,
           t.descripcion, t.actividad_id,
           a.fecha::text AS actividad_fecha,
           a.descripcion AS actividad_desc,
           e.id AS entidad_id, e.nombre AS entidad_nombre,
           COUNT(r.id)::int AS total_respuestas,
           MAX(r.created_at)::text AS ultima_respuesta
    FROM encuesta_token t
    JOIN entidad e ON e.id = t.entidad_id
    LEFT JOIN programacion_actividad a ON a.id = t.actividad_id
    LEFT JOIN encuesta_respuesta r ON r.token_id = t.id
    GROUP BY t.id, e.id, e.nombre, a.fecha, a.descripcion
    ORDER BY a.fecha DESC NULLS LAST, e.nombre, t.created_at DESC
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

  const { entidad_id, actividad_id, descripcion } = await req.json();
  if (!entidad_id) return NextResponse.json({ error: "entidad_id requerido" }, { status: 400 });
  if (!actividad_id) return NextResponse.json({ error: "actividad_id requerido" }, { status: 400 });

  const entRes = await pool.query<{ nombre: string }>(`SELECT nombre FROM entidad WHERE id = $1`, [entidad_id]);
  if (!entRes.rows.length) return NextResponse.json({ error: "Entidad no encontrada" }, { status: 404 });

  const slug = slugNombre(entRes.rows[0].nombre);
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const token = `${slug}-${suffix}`;

  // Verificar si ya existe encuesta para esta actividad
  const existente = await pool.query<{ id: number; token: string }>(
    `SELECT id, token FROM encuesta_token WHERE actividad_id = $1 LIMIT 1`,
    [actividad_id]
  );
  if (existente.rows.length > 0)
    return NextResponse.json(
      { error: "Ya existe una encuesta para este evento." },
      { status: 409 }
    );

  const { rows } = await pool.query<{ id: number }>(`
    INSERT INTO encuesta_token (entidad_id, token, descripcion, actividad_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `, [entidad_id, token, descripcion ?? null, actividad_id]);

  return NextResponse.json({ id: rows[0].id, token }, { status: 201 });
}
