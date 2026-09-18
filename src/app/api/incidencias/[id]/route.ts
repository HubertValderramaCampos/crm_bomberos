import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import { obtenerUrlFirmada } from "@/lib/storage";
import { ESTADOS_REPORTE } from "@/lib/incidenciasCatalogo";
import pool from "@/lib/db";

function puedeGestionar(rol: string) {
  return esRolJefe(rol) || rol === "OPERACIONES";
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const { rows } = await pool.query(`
    SELECT
      r.id, r.fecha, r.tipo_reporte, r.categoria, r.descripcion, r.estado,
      r.created_at, r.updated_at,
      b.id AS bombero_id, b.apellidos, b.nombres, b.grado, b.codigo AS bombero_codigo,
      v.id AS vehiculo_id, v.codigo AS vehiculo_codigo, v.tipo AS vehiculo_tipo
    FROM reporte_operativo r
    JOIN bombero b ON b.id = r.bombero_id
    LEFT JOIN vehiculo v ON v.id = r.vehiculo_id
    WHERE r.id = $1
  `, [id]);

  if (rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const reporte = rows[0];

  const fotosRes = await pool.query<{ id: number; foto_key: string; orden: number }>(
    `SELECT id, foto_key, orden FROM reporte_operativo_foto WHERE reporte_id = $1 ORDER BY orden`, [id]
  );
  const fotos = await Promise.all(fotosRes.rows.map(async f => ({
    id:  f.id,
    url: await obtenerUrlFirmada(f.foto_key, 3600).catch(() => null),
  })));

  return NextResponse.json({ reporte, fotos, puedeGestionar: puedeGestionar(session.user.rol) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!puedeGestionar(session.user.rol))
    return NextResponse.json({ error: "No tienes permiso para cambiar el estado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const estado: string = body.estado;
  if (!(ESTADOS_REPORTE as readonly string[]).includes(estado))
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });

  const { rows } = await pool.query(
    `UPDATE reporte_operativo SET estado = $1, updated_at = NOW() WHERE id = $2 RETURNING id, estado`,
    [estado, id]
  );
  if (rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
