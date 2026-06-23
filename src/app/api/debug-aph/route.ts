import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["JEFE_COMPANIA", "SEGUNDO_JEFE", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const emergenciaId = searchParams.get("emergencia_id");

  const [countRes, colsRes, sampleRes, countEmerg] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM emergencia_efectivo"),
    pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'emergencia_efectivo' ORDER BY ordinal_position"),
    pool.query("SELECT * FROM emergencia_efectivo LIMIT 5"),
    pool.query("SELECT COUNT(*) FROM emergencia"),
  ]);

  let parteEfectivos = null;
  if (emergenciaId) {
    const r = await pool.query("SELECT * FROM emergencia_efectivo WHERE emergencia_id = $1 LIMIT 10", [emergenciaId]);
    parteEfectivos = { count: r.rowCount, rows: r.rows };
  }

  return NextResponse.json({
    emergencia_efectivo_total: countRes.rows[0].count,
    emergencia_total: countEmerg.rows[0].count,
    columnas: colsRes.rows.map(r => r.column_name),
    muestra: sampleRes.rows,
    parte_especifico: parteEfectivos,
  });
}
