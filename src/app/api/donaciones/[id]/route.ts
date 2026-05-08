import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await params;
  const { fecha, entidad, tipo_donacion, entidad_id } = await req.json();

  const { rows } = await pool.query(
    `UPDATE donacion SET fecha = $1, entidad = $2, tipo_donacion = $3, entidad_id = $4
     WHERE id = $5 RETURNING id`,
    [fecha, entidad, tipo_donacion, entidad_id ?? null, id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await params;
  await pool.query(`DELETE FROM donacion WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
