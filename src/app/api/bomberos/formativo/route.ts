import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { rows } = await pool.query(
    `SELECT id, apellidos, nombres, categoria
     FROM bombero
     WHERE activo = true AND categoria IN ('ASPIRANTE', 'POSTULANTE')
     ORDER BY apellidos`
  );
  return NextResponse.json(rows);
}
