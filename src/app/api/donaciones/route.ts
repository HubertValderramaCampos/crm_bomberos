import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT d.id, d.fecha::text, d.tipo_donacion, d.entidad_id, d.created_at,
           d.observaciones,
           e.nombre AS entidad_nombre, e.tipo AS entidad_tipo,
           COUNT(i.id)::int AS total_items,
           COALESCE(
             json_agg(json_build_object('descripcion', i.descripcion, 'cantidad', i.cantidad, 'unidad', i.unidad, 'categoria', i.categoria)
             ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL),
             '[]'
           ) AS items
    FROM donacion d
    JOIN entidad e ON e.id = d.entidad_id
    LEFT JOIN donacion_item i ON i.donacion_id = d.id
    GROUP BY d.id, e.id, e.nombre, e.tipo
    ORDER BY d.fecha DESC
  `);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { fecha, tipo_donacion, entidad_id, observaciones, items } = await req.json();
  if (!fecha || !tipo_donacion || !entidad_id)
    return NextResponse.json({ error: "Campos obligatorios: fecha, tipo_donacion, entidad_id" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO donacion (fecha, tipo_donacion, entidad_id, observaciones)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [fecha, tipo_donacion, entidad_id, observaciones ?? null]
    );
    const donacionId = rows[0].id;
    const lista = Array.isArray(items) ? items : [];
    for (const item of lista) {
      if (!item.descripcion?.trim()) continue;
      await client.query(
        `INSERT INTO donacion_item (donacion_id, descripcion, cantidad, unidad, categoria)
         VALUES ($1, $2, $3, $4, $5)`,
        [donacionId, item.descripcion.trim(), item.cantidad || null, item.unidad || null, item.categoria || null]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ id: donacionId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[POST /api/donaciones]", err);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  } finally {
    client.release();
  }
}
