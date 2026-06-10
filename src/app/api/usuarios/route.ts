import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { rows } = await pool.query(`
    SELECT u.id, u.rol, u.activo, u.codigo, u.created_at::text
    FROM usuario u
    WHERE u.bombero_id IS NULL
    ORDER BY u.rol
  `);
  return NextResponse.json(rows);
}
