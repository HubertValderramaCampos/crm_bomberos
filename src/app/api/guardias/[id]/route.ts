import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolGuardia } from "@/lib/roles";
import pool from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolGuardia(session.user.rol)) {
    return NextResponse.json({ error: "Solo el jefe de guardia puede aprobar o rechazar" }, { status: 403 });
  }

  const { id } = await params;
  const { estado, nota } = await req.json();

  if (estado !== "APROBADA" && estado !== "RECHAZADA") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { rows } = await pool.query(`
    UPDATE guardia_nocturna_solicitud
    SET estado = $1, resuelto_en = NOW(), resuelto_por = $2, nota = COALESCE($3, nota)
    WHERE id = $4
    RETURNING id, estado
  `, [estado, Number(session.user.id), nota ?? null, id]);

  if (rows.length === 0) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
