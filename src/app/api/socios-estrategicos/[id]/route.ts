import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const ROLES_ADMIN = ["JEFE_COMPANIA", "ADMINISTRACION"];

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_ADMIN.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { empresa, tipo_proceso, contacto, telefono, correo, estado, notas } = await req.json();
  if (!empresa?.trim() || !tipo_proceso?.trim())
    return NextResponse.json({ error: "empresa y tipo_proceso son obligatorios" }, { status: 400 });

  const { rows } = await pool.query(
    `UPDATE socio_estrategico SET empresa=$1, tipo_proceso=$2, contacto=$3, telefono=$4,
     correo=$5, estado=$6, notas=$7 WHERE id=$8 RETURNING *`,
    [empresa.trim(), tipo_proceso.trim(), contacto || null, telefono || null, correo || null, estado || "ACTIVO", notas || null, params.id]
  );
  if (!rows.length) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_ADMIN.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  await pool.query(`DELETE FROM socio_estrategico WHERE id=$1`, [params.id]);
  return NextResponse.json({ ok: true });
}
