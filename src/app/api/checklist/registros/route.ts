import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fechaLima } from "@/lib/fechaLima";
import { registrarHistorialChecklist } from "@/lib/checklistHistorial";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vehiculoId = searchParams.get("vehiculoId");
  const fecha = searchParams.get("fecha");
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const condiciones: string[] = [];
  const valores: unknown[] = [];
  let i = 1;
  if (vehiculoId) { condiciones.push(`r.vehiculo_id = $${i++}`); valores.push(Number(vehiculoId)); }
  if (fecha)      { condiciones.push(`r.fecha = $${i++}`);       valores.push(fecha); }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(limit);

  const { rows } = await pool.query(`
    SELECT
      r.id, r.vehiculo_id, r.fecha, r.estado, r.observaciones, r.efectivo_al_mando,
      r.created_at, r.completado_en,
      v.codigo AS vehiculo_codigo,
      b.id AS bombero_id, COALESCE(b.codigo, u.codigo) AS bombero_codigo, b.grado,
      COALESCE(b.apellidos, 'Piloto') AS apellidos, COALESCE(b.nombres, u.codigo) AS nombres,
      COUNT(ri.id) FILTER (WHERE ri.estado != 'PENDIENTE')::int AS items_marcados,
      COUNT(ri.id)::int AS items_total,
      COUNT(ri.id) FILTER (WHERE ri.estado = 'MALO')::int AS items_malos,
      COUNT(ri.id) FILTER (WHERE ri.estado = 'FALTA')::int AS items_faltantes
    FROM checklist_registro r
    JOIN vehiculo v ON v.id = r.vehiculo_id
    LEFT JOIN bombero b ON b.id = r.bombero_id
    LEFT JOIN usuario u ON u.id = r.usuario_id
    LEFT JOIN checklist_registro_item ri ON ri.registro_id = r.id
    ${where}
    GROUP BY r.id, v.codigo, b.id, b.codigo, b.grado, b.apellidos, b.nombres, u.codigo
    ORDER BY r.created_at DESC
    LIMIT $${i}
  `, valores);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!session.user.bomberoId && session.user.rol !== "PILOTO") {
    return NextResponse.json({ error: "Solo un efectivo puede iniciar un checklist" }, { status: 403 });
  }

  const body = await req.json();
  const vehiculoId = Number(body.vehiculoId);
  const efectivoAlMando: string | null = body.efectivoAlMando || null;
  if (!vehiculoId) return NextResponse.json({ error: "Falta vehiculoId" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const itemsRes = await client.query<{ id: number }>(
      `SELECT id FROM checklist_item WHERE vehiculo_id = $1 AND activo = true`, [vehiculoId]
    );
    if (itemsRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Esta unidad no tiene un catálogo de checklist" }, { status: 400 });
    }

    const regRes = await client.query<{ id: number }>(`
      INSERT INTO checklist_registro (vehiculo_id, fecha, bombero_id, efectivo_al_mando, usuario_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [vehiculoId, fechaLima(), session.user.bomberoId ?? null, efectivoAlMando, Number(session.user.id)]);
    const registroId = regRes.rows[0].id;

    const values: string[] = [];
    const params: unknown[] = [];
    let i = 1;
    for (const item of itemsRes.rows) {
      values.push(`($${i++}, $${i++})`);
      params.push(registroId, item.id);
    }
    await client.query(
      `INSERT INTO checklist_registro_item (registro_id, item_id) VALUES ${values.join(", ")}`,
      params
    );

    await client.query("COMMIT");

    await registrarHistorialChecklist(registroId, session.user.id, session.user.nombres, "INICIO");

    return NextResponse.json({ id: registroId }, { status: 201 });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
