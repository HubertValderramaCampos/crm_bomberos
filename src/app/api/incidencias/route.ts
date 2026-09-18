import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fechaLima } from "@/lib/fechaLima";
import { TIPOS_REPORTE, CATEGORIAS_EQUIPAMIENTO, MAX_FOTOS_REPORTE } from "@/lib/incidenciasCatalogo";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

  const condiciones: string[] = [];
  const valores: unknown[] = [];
  let i = 1;
  if (estado) { condiciones.push(`r.estado = $${i++}`); valores.push(estado); }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(limit);

  const { rows } = await pool.query(`
    SELECT
      r.id, r.fecha, r.tipo_reporte, r.categoria, r.descripcion, r.estado, r.created_at,
      b.apellidos, b.nombres, b.grado,
      v.codigo AS vehiculo_codigo,
      COUNT(f.id)::int AS fotos_total
    FROM reporte_operativo r
    JOIN bombero b ON b.id = r.bombero_id
    LEFT JOIN vehiculo v ON v.id = r.vehiculo_id
    LEFT JOIN reporte_operativo_foto f ON f.reporte_id = r.id
    ${where}
    GROUP BY r.id, b.apellidos, b.nombres, b.grado, v.codigo
    ORDER BY r.created_at DESC
    LIMIT $${i}
  `, valores);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const bomberoId = Number(body.bomberoId);
  const tipoReporte: string = body.tipoReporte;
  const categoria: string = body.categoria;
  const vehiculoId = body.vehiculoId ? Number(body.vehiculoId) : null;
  const descripcion: string = (body.descripcion || "").trim();
  const fotoKeys: string[] = Array.isArray(body.fotoKeys)
    ? body.fotoKeys.filter((k: unknown) => typeof k === "string").slice(0, MAX_FOTOS_REPORTE)
    : [];

  if (!bomberoId) return NextResponse.json({ error: "Selecciona el responsable del registro" }, { status: 400 });
  if (!(TIPOS_REPORTE as readonly string[]).includes(tipoReporte))
    return NextResponse.json({ error: "Selecciona el tipo de reporte" }, { status: 400 });
  if (!(CATEGORIAS_EQUIPAMIENTO as readonly string[]).includes(categoria))
    return NextResponse.json({ error: "Selecciona el equipamiento" }, { status: 400 });
  if (categoria === "VEHICULO" && !vehiculoId)
    return NextResponse.json({ error: "Selecciona la unidad" }, { status: 400 });
  if (!descripcion) return NextResponse.json({ error: "Describe el reporte" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: number }>(`
      INSERT INTO reporte_operativo (fecha, bombero_id, tipo_reporte, categoria, vehiculo_id, descripcion, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      fechaLima(),
      bomberoId,
      tipoReporte,
      categoria,
      categoria === "VEHICULO" ? vehiculoId : null,
      descripcion,
      Number(session.user.id),
    ]);
    const reporteId = rows[0].id;

    if (fotoKeys.length > 0) {
      const values: string[] = [];
      const params: unknown[] = [];
      let i = 1;
      fotoKeys.forEach((key, idx) => {
        values.push(`($${i++}, $${i++}, $${i++})`);
        params.push(reporteId, key, idx);
      });
      await client.query(
        `INSERT INTO reporte_operativo_foto (reporte_id, foto_key, orden) VALUES ${values.join(", ")}`,
        params
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: reporteId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[POST /api/incidencias]", err);
    return NextResponse.json({ error: "Error al crear el reporte" }, { status: 500 });
  } finally {
    client.release();
  }
}
