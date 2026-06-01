import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT d.id, d.fecha::text, d.tipo_donacion, d.entidad_id, d.created_at,
           d.descripcion, d.cantidad, d.unidad, d.observaciones,
           e.nombre AS entidad_nombre, e.tipo AS entidad_tipo
    FROM donacion d
    JOIN entidad e ON e.id = d.entidad_id
    ORDER BY d.fecha DESC
  `);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const { fecha, tipo_donacion, entidad_id, descripcion, cantidad, unidad, observaciones } = await req.json();
  if (!fecha || !tipo_donacion || !entidad_id) {
    return NextResponse.json({ error: "Campos obligatorios: fecha, tipo_donacion, entidad_id" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO donacion (fecha, tipo_donacion, entidad_id, descripcion, cantidad, unidad, observaciones)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [fecha, tipo_donacion, entidad_id, descripcion ?? null, cantidad ?? null, unidad ?? null, observaciones ?? null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
