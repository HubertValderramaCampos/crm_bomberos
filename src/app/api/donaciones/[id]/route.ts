import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await params;
  const { fecha, tipo_donacion, entidad_id, observaciones, items } = await req.json();

  if (!fecha || !tipo_donacion || !entidad_id)
    return NextResponse.json({ error: "Campos obligatorios: fecha, tipo_donacion, entidad_id" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE donacion SET fecha=$1, tipo_donacion=$2, entidad_id=$3, observaciones=$4 WHERE id=$5 RETURNING id`,
      [fecha, tipo_donacion, entidad_id, observaciones ?? null, id]
    );
    if (rows.length === 0) { await client.query("ROLLBACK"); return NextResponse.json({ error: "No encontrado" }, { status: 404 }); }

    await client.query(`DELETE FROM donacion_item WHERE donacion_id = $1`, [id]);
    const lista = Array.isArray(items) ? items : [];
    for (const item of lista) {
      if (!item.descripcion?.trim()) continue;
      await client.query(
        `INSERT INTO donacion_item (donacion_id, descripcion, cantidad, unidad, categoria)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.descripcion.trim(), item.cantidad || null, item.unidad || null, item.categoria || null]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[PATCH /api/donaciones/id]", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { id } = await params;
  await pool.query(`DELETE FROM donacion WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
