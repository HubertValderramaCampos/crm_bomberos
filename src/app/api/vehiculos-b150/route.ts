import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CODIGOS_VEHICULOS_B150 } from "@/lib/vehiculosB150";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query<{ id: number; codigo: string; tipo: string }>(`
    SELECT id, codigo, tipo FROM vehiculo
    WHERE codigo = ANY($1)
    ORDER BY array_position($1::varchar[], codigo)
  `, [CODIGOS_VEHICULOS_B150 as unknown as string[]]);

  return NextResponse.json(rows);
}
