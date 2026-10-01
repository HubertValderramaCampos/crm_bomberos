import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fechaLima } from "@/lib/fechaLima";
import { CODIGOS_VEHICULOS_B150 } from "@/lib/vehiculosB150";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const hoy = fechaLima();

  const { rows } = await pool.query(`
    SELECT
      v.id AS vehiculo_id, v.codigo AS vehiculo_codigo, v.tipo AS vehiculo_tipo,
      r.id AS reporte_id, r.fecha, r.created_at, r.kilometraje,
      r.combustible, r.aceite, r.refrigerante, r.estado_neumaticos,
      COALESCE(b.apellidos, 'Piloto') AS apellidos,
      COALESCE(b.nombres, INITCAP(u.codigo)) AS nombres,
      b.grado,
      ($2::date - r.fecha) AS dias_atraso
    FROM vehiculo v
    LEFT JOIN LATERAL (
      SELECT * FROM reporte_piloto rp
      WHERE rp.vehiculo_id = v.id
      ORDER BY rp.created_at DESC
      LIMIT 1
    ) r ON true
    LEFT JOIN bombero b ON b.id = r.bombero_id
    LEFT JOIN usuario u ON u.id = r.creado_por
    WHERE v.codigo = ANY($1)
    ORDER BY array_position($1::varchar[], v.codigo)
  `, [CODIGOS_VEHICULOS_B150 as unknown as string[], hoy]);

  return NextResponse.json(rows);
}
