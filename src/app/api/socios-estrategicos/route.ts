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
    SELECT s.id, s.empresa, s.tipo_proceso, s.contacto, s.telefono, s.correo,
           s.estado, s.notas, s.created_at,
           c.id AS clasificacion_id, c.tamano, c.tipo_apoyo, c.nivel, c.descripcion
    FROM socio_estrategico s
    LEFT JOIN clasificacion_socio c ON c.socio_id = s.id
    ORDER BY s.empresa
  `);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_ADMIN.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { empresa, tipo_proceso, contacto, telefono, correo, estado, notas } = await req.json();
  if (!empresa?.trim() || !tipo_proceso?.trim())
    return NextResponse.json({ error: "empresa y tipo_proceso son obligatorios" }, { status: 400 });

  const { rows } = await pool.query(
    `INSERT INTO socio_estrategico (empresa, tipo_proceso, contacto, telefono, correo, estado, notas)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [empresa.trim(), tipo_proceso.trim(), contacto || null, telefono || null, correo || null, estado || "ACTIVO", notas || null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
