import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json([]);

  const { rows } = await pool.query(
    `SELECT seccion FROM usuario_permisos WHERE usuario_id = $1`,
    [session.user.id]
  );
  return NextResponse.json(rows.map(r => r.seccion));
}
