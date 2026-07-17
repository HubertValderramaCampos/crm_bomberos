import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolGuardia } from "@/lib/roles";
import pool from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolGuardia(session.user.rol)) {
    return NextResponse.json({ error: "Solo el jefe de guardia puede editar el aforo" }, { status: 403 });
  }

  const { pool: poolNombre, capacidad } = await req.json();
  if (poolNombre !== "MASCULINA" && poolNombre !== "FEMENINA") {
    return NextResponse.json({ error: "Pool inválido" }, { status: 400 });
  }
  const cap = Number(capacidad);
  if (!Number.isInteger(cap) || cap < 0) {
    return NextResponse.json({ error: "Capacidad inválida" }, { status: 400 });
  }

  const { rows } = await pool.query(`
    UPDATE guardia_nocturna_pool
    SET capacidad = $1, updated_at = NOW(), updated_por = $2
    WHERE pool = $3
    RETURNING pool, capacidad
  `, [cap, Number(session.user.id), poolNombre]);

  return NextResponse.json(rows[0]);
}
