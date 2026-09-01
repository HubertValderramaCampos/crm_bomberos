import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query<{ id: number; codigo: string; tipo: string }>(`
    SELECT DISTINCT v.id, v.codigo, v.tipo
    FROM vehiculo v
    JOIN checklist_item ci ON ci.vehiculo_id = v.id AND ci.activo = true
    ORDER BY v.codigo
  `);

  return NextResponse.json(rows);
}
