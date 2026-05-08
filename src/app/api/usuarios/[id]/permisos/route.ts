import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { rows } = await pool.query(
    `SELECT seccion FROM usuario_permisos WHERE usuario_id = $1`,
    [id]
  );
  return NextResponse.json(rows.map(r => r.seccion));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "JEFE_COMPANIA") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await params;
  const secciones: string[] = await req.json();

  await pool.query(`DELETE FROM usuario_permisos WHERE usuario_id = $1`, [id]);

  if (secciones.length > 0) {
    const values = secciones.map((s, i) => `($1, $${i + 2})`).join(", ");
    await pool.query(
      `INSERT INTO usuario_permisos (usuario_id, seccion) VALUES ${values}`,
      [id, ...secciones]
    );
  }

  return NextResponse.json({ ok: true });
}
