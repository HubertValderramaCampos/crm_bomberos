import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: notas del bombero actual (aspirante/postulante) o de un bombero específico (admin)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bomberoIdParam = searchParams.get("bombero_id");

  // Admins pueden ver notas de cualquier bombero
  const esAdmin = ROLES_JEFE.includes(session.user.rol);

  let bomberoId: number;
  if (bomberoIdParam && esAdmin) {
    bomberoId = Number(bomberoIdParam);
  } else if (session.user.bomberoId) {
    bomberoId = session.user.bomberoId;
  } else {
    return NextResponse.json({ error: "Sin bombero_id" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `SELECT n.id, n.titulo, n.contenido, n.calificacion, n.fecha::text,
            u.codigo AS creado_por_codigo
     FROM formativa_nota n
     LEFT JOIN usuario u ON u.id = n.creado_por
     WHERE n.bombero_id = $1
     ORDER BY n.fecha DESC, n.id DESC`,
    [bomberoId]
  );
  return NextResponse.json(rows);
}

// POST: crear nota (solo admin)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { bombero_id, titulo, contenido, calificacion, fecha } = await req.json();
  if (!bombero_id || !titulo)
    return NextResponse.json({ error: "bombero_id y titulo son obligatorios" }, { status: 400 });

  const { rows } = await pool.query(
    `INSERT INTO formativa_nota (bombero_id, titulo, contenido, calificacion, fecha, creado_por)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [bombero_id, titulo, contenido ?? null, calificacion ?? null,
     fecha ?? new Date().toISOString().slice(0, 10), Number(session.user.id)]
  );
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
