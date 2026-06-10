import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const ROLES_VALIDOS = [
  "JEFE_COMPANIA", "ADMINISTRACION", "OPERACIONES",
  "SERVICIOS_GENERALES", "INSTRUCCION", "SANIDAD", "IMAGEN", "BOMBERO"
];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol)) {
    return NextResponse.json({ error: "Solo el Jefe de Compañía puede cambiar roles" }, { status: 403 });
  }

  const { id } = await params;
  const { rol } = await req.json();

  if (!ROLES_VALIDOS.includes(rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE usuario SET rol = $1, updated_at = NOW() WHERE id = $2 RETURNING id, rol`,
    [rol, id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
