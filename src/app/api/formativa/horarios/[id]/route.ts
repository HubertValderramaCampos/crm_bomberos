import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const { dia_semana, hora_inicio, hora_fin, descripcion, activo } = await req.json();
  await pool.query(
    `UPDATE formativa_horario SET dia_semana=$1, hora_inicio=$2, hora_fin=$3,
     descripcion=$4, activo=$5 WHERE id=$6`,
    [dia_semana, hora_inicio, hora_fin, descripcion ?? null, activo ?? true, id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  await pool.query(`DELETE FROM formativa_horario WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
