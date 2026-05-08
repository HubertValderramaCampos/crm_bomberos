import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT d.id, d.fecha::text, d.entidad, d.tipo_donacion, d.entidad_id, d.created_at,
           e.nombre AS entidad_nombre
    FROM donacion d
    LEFT JOIN entidad e ON e.id = d.entidad_id
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

  const { fecha, entidad, tipo_donacion, entidad_id } = await req.json();
  if (!fecha || !entidad || !tipo_donacion) {
    return NextResponse.json({ error: "Campos obligatorios: fecha, entidad, tipo_donacion" }, { status: 400 });
  }

  const { rows } = await pool.query(
    `INSERT INTO donacion (fecha, entidad, tipo_donacion, entidad_id)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [fecha, entidad, tipo_donacion, entidad_id ?? null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
