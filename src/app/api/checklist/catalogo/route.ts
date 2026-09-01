import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vehiculoId = Number(searchParams.get("vehiculoId"));
  if (!vehiculoId) return NextResponse.json({ error: "Falta vehiculoId" }, { status: 400 });

  const { rows } = await pool.query<{
    id: number; seccion: string; orden: number; articulo: string; cantidad: number | null;
  }>(`
    SELECT id, seccion, orden, articulo, cantidad
    FROM checklist_item
    WHERE vehiculo_id = $1 AND activo = true
    ORDER BY orden
  `, [vehiculoId]);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolJefe(session.user.rol)) {
    return NextResponse.json({ error: "No tienes permiso para editar el catálogo" }, { status: 403 });
  }

  const body = await req.json();
  const { vehiculoId, seccion, articulo } = body;
  const cantidad = body.cantidad != null && body.cantidad !== "" ? Number(body.cantidad) : null;
  const orden = body.orden != null ? Number(body.orden) : null;

  if (!vehiculoId || !seccion || !articulo) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  let ordenFinal = orden;
  if (ordenFinal == null) {
    const { rows } = await pool.query<{ max: number | null }>(
      `SELECT MAX(orden) AS max FROM checklist_item WHERE vehiculo_id = $1`, [vehiculoId]
    );
    ordenFinal = (rows[0]?.max ?? 0) + 1;
  }

  const { rows } = await pool.query<{ id: number }>(`
    INSERT INTO checklist_item (vehiculo_id, seccion, orden, articulo, cantidad)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [vehiculoId, seccion, ordenFinal, articulo, cantidad]);

  return NextResponse.json(rows[0], { status: 201 });
}
