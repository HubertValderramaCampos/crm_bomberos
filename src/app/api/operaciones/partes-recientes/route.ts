import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(`
    SELECT id, numero_parte, tipo, created_at::text
    FROM emergencia
    ORDER BY created_at DESC
    LIMIT 100
  `);
  return NextResponse.json(rows);
}
