import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const ROLES_ADMIN = ROLES_JEFE;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_ADMIN.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { socio_id, tamano, tipo_apoyo, nivel, descripcion } = await req.json();
  if (!socio_id || !tamano?.trim() || !tipo_apoyo?.trim())
    return NextResponse.json({ error: "socio_id, tamano y tipo_apoyo son obligatorios" }, { status: 400 });

  const { rows } = await pool.query(
    `UPDATE clasificacion_socio SET socio_id=$1, tamano=$2, tipo_apoyo=$3, nivel=$4, descripcion=$5
     WHERE id=$6 RETURNING *`,
    [socio_id, tamano.trim(), tipo_apoyo.trim(), nivel || "MEDIO", descripcion || null, id]
  );
  if (!rows.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_ADMIN.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  await pool.query(`DELETE FROM clasificacion_socio WHERE id=$1`, [id]);
  return NextResponse.json({ ok: true });
}
