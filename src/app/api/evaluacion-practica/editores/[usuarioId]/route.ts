import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import pool from "@/lib/db";

// DELETE: revocar autorización individual (solo jefe)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ usuarioId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolJefe(session.user.rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { usuarioId } = await params;
  await pool.query(`DELETE FROM evaluacion_practica_editor WHERE usuario_id = $1`, [usuarioId]);
  return NextResponse.json({ ok: true });
}
