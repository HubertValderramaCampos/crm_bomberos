import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const { fecha, descripcion, lugar, hora_inicio, hora_fin } = await req.json();

  await pool.query(`
    UPDATE programacion_actividad
    SET fecha = $1, descripcion = $2, lugar = $3, hora_inicio = $4, hora_fin = $5
    WHERE id = $6 AND tipo = 'Proyección social'
  `, [fecha, descripcion || null, lugar || null, hora_inicio || null, hora_fin || null, id]);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;

  await pool.query(`
    DELETE FROM programacion_actividad WHERE id = $1 AND tipo = 'Proyección social'
  `, [id]);

  return NextResponse.json({ ok: true });
}
