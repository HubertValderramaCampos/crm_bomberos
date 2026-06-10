import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: ítems de una donación
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { rows } = await pool.query(
    `SELECT id, descripcion, cantidad, unidad, categoria
     FROM donacion_item WHERE donacion_id = $1 ORDER BY id`,
    [id]
  );
  return NextResponse.json(rows);
}

// PUT: reemplazar todos los ítems de una donación
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  const items: { descripcion: string; cantidad: string; unidad: string; categoria: string }[] = await req.json();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM donacion_item WHERE donacion_id = $1`, [id]);
    for (const item of items) {
      if (!item.descripcion?.trim()) continue;
      await client.query(
        `INSERT INTO donacion_item (donacion_id, descripcion, cantidad, unidad, categoria)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.descripcion.trim(), item.cantidad || null, item.unidad || null, item.categoria || null]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[donacion items PUT]", err);
    return NextResponse.json({ error: "Error al guardar ítems" }, { status: 500 });
  } finally {
    client.release();
  }
}
