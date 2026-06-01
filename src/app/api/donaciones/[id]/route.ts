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
  const { fecha, tipo_donacion, entidad_id, descripcion, cantidad, unidad, observaciones } = await req.json();

  if (!fecha || !tipo_donacion || !entidad_id) {
    return NextResponse.json({ error: "Campos obligatorios: fecha, tipo_donacion, entidad_id" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE donacion SET fecha=$1, tipo_donacion=$2, entidad_id=$3,
     descripcion=$4, cantidad=$5, unidad=$6, observaciones=$7
     WHERE id=$8 RETURNING id`,
    [fecha, tipo_donacion, entidad_id, descripcion ?? null, cantidad ?? null, unidad ?? null, observaciones ?? null, id]
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
