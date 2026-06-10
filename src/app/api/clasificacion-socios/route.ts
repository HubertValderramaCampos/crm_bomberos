import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const ROLES_ADMIN = ROLES_JEFE;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT c.id, c.socio_id, c.tamano, c.tipo_apoyo, c.nivel, c.descripcion, c.created_at,
           s.empresa AS socio_empresa
    FROM clasificacion_socio c
    JOIN socio_estrategico s ON s.id = c.socio_id
    ORDER BY s.empresa
  `);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_ADMIN.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { socio_id, tamano, tipo_apoyo, nivel, descripcion } = await req.json();
  if (!socio_id || !tamano?.trim() || !tipo_apoyo?.trim())
    return NextResponse.json({ error: "socio_id, tamano y tipo_apoyo son obligatorios" }, { status: 400 });

  const { rows } = await pool.query(
    `INSERT INTO clasificacion_socio (socio_id, tamano, tipo_apoyo, nivel, descripcion)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [socio_id, tamano.trim(), tipo_apoyo.trim(), nivel || "MEDIO", descripcion || null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
