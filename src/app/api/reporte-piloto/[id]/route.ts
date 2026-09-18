import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { obtenerUrlFirmada } from "@/lib/storage";
import pool from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const { rows } = await pool.query(`
    SELECT
      r.id, r.fecha, r.kilometraje, r.combustible, r.aceite, r.refrigerante,
      r.estado_neumaticos, r.estado_carroceria, r.estado_suspension, r.estado_espejos_vidrios, r.estado_cabina,
      r.created_at,
      b.id AS bombero_id, b.apellidos, b.nombres, b.grado, b.codigo AS bombero_codigo,
      v.id AS vehiculo_id, v.codigo AS vehiculo_codigo, v.tipo AS vehiculo_tipo
    FROM reporte_piloto r
    JOIN bombero b ON b.id = r.bombero_id
    JOIN vehiculo v ON v.id = r.vehiculo_id
    WHERE r.id = $1
  `, [id]);

  if (rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const reporte = rows[0];

  const fotosRes = await pool.query<{ id: number; foto_key: string; orden: number }>(
    `SELECT id, foto_key, orden FROM reporte_piloto_foto WHERE reporte_id = $1 ORDER BY orden`, [id]
  );
  const fotos = await Promise.all(fotosRes.rows.map(async f => ({
    id:  f.id,
    url: await obtenerUrlFirmada(f.foto_key, 3600).catch(() => null),
  })));

  return NextResponse.json({ reporte, fotos });
}
