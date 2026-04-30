import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query<{ id: number; apellidos: string; nombres: string; grado: string; codigo: string }>(
    `SELECT id, apellidos, nombres, grado, codigo FROM bombero WHERE activo = true ORDER BY apellidos`
  );
  return NextResponse.json(rows);
}
