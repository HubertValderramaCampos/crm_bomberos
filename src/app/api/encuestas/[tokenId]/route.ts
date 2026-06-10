import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: respuestas de un token específico
export async function GET(_req: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { tokenId } = await params;

  const { rows } = await pool.query(`
    SELECT r.*
    FROM encuesta_respuesta r
    JOIN encuesta_token t ON t.id = r.token_id
    WHERE t.id = $1
    ORDER BY r.created_at DESC
  `, [tokenId]);

  return NextResponse.json(rows);
}

// DELETE: desactivar (?eliminar no presente) o eliminar permanentemente (?eliminar=1)
export async function DELETE(req: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { tokenId } = await params;
  const { searchParams } = new URL(req.url);

  if (searchParams.get("eliminar") === "1") {
    await pool.query(`DELETE FROM encuesta_token WHERE id = $1`, [tokenId]);
    return NextResponse.json({ ok: true, eliminado: true });
  }

  await pool.query(`UPDATE encuesta_token SET activo = false WHERE id = $1`, [tokenId]);
  return NextResponse.json({ ok: true });
}
