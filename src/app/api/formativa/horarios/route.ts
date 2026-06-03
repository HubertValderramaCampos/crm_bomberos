import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT id, dia_semana, hora_inicio::text, hora_fin::text, descripcion, activo
     FROM formativa_horario ORDER BY dia_semana, hora_inicio`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { dia_semana, hora_inicio, hora_fin, descripcion } = await req.json();
  if (dia_semana == null || !hora_inicio || !hora_fin)
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

  const { rows } = await pool.query(
    `INSERT INTO formativa_horario (dia_semana, hora_inicio, hora_fin, descripcion)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [dia_semana, hora_inicio, hora_fin, descripcion ?? null]
  );
  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
