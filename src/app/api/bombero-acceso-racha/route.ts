import { ROLES_JEFE } from "@/lib/roles";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT seccion, racha_min, puede_editar FROM bombero_acceso_racha ORDER BY seccion`
  );
  return NextResponse.json(rows);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_JEFE.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const body: { seccion: string; racha_min: number; puede_editar: boolean }[] = await req.json();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const row of body) {
      await client.query(
        `INSERT INTO bombero_acceso_racha (seccion, racha_min, puede_editar)
         VALUES ($1, $2, $3)
         ON CONFLICT (seccion) DO UPDATE SET racha_min = $2, puede_editar = $3`,
        [row.seccion, row.racha_min, row.puede_editar]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[bombero-acceso-racha PUT]", err);
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  } finally {
    client.release();
  }
}
