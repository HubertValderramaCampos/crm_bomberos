import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const rolesPermitidos = ["JEFE_COMPANIA", "OPERACIONES", "ADMINISTRACION"];
  if (!rolesPermitidos.includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await params;
  const { rowCount } = await pool.query(
    `UPDATE emergencia SET estado = 'CANCELADA' WHERE id = $1 AND estado = 'ATENDIENDO'`,
    [id]
  );

  if (!rowCount) return NextResponse.json({ error: "No encontrada o ya no está activa" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
