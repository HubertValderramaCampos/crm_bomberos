import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 });

  const rolesPermitidos = ROLES_JEFE;
  if (!rolesPermitidos.includes(session.user.rol)) return NextResponse.json({ count: 0 });

  const { rows } = await pool.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM solicitud_capacitacion WHERE estado = 'PENDIENTE'`
  );
  return NextResponse.json({ count: rows[0].count });
}
