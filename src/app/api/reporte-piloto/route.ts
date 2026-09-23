import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fechaLima } from "@/lib/fechaLima";
import {
  NIVELES_COMBUSTIBLE, NIVELES_ACEITE_REFRIGERANTE, MAX_FOTOS_REPORTE_PILOTO,
} from "@/lib/reportePilotoCatalogo";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const vehiculoId = searchParams.get("vehiculoId");
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

  const condiciones: string[] = [];
  const valores: unknown[] = [];
  let i = 1;
  if (vehiculoId) { condiciones.push(`r.vehiculo_id = $${i++}`); valores.push(Number(vehiculoId)); }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  valores.push(limit);

  const { rows } = await pool.query(`
    SELECT
      r.id, r.fecha, r.kilometraje, r.combustible, r.aceite, r.refrigerante, r.created_at,
      COALESCE(b.apellidos, 'Piloto') AS apellidos, COALESCE(b.nombres, INITCAP(u.codigo)) AS nombres, b.grado,
      v.codigo AS vehiculo_codigo,
      COUNT(f.id)::int AS fotos_total
    FROM reporte_piloto r
    LEFT JOIN bombero b ON b.id = r.bombero_id
    LEFT JOIN usuario u ON u.id = r.creado_por
    JOIN vehiculo v ON v.id = r.vehiculo_id
    LEFT JOIN reporte_piloto_foto f ON f.reporte_id = r.id
    ${where}
    GROUP BY r.id, b.apellidos, b.nombres, b.grado, u.codigo, v.codigo
    ORDER BY r.created_at DESC
    LIMIT $${i}
  `, valores);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const fecha: string = body.fecha || fechaLima();
  const vehiculoId = Number(body.vehiculoId);
  // Las cuentas PILOTO no tienen ficha de bombero: el piloto de turno es la propia cuenta.
  const esPiloto = session.user.rol === "PILOTO";
  const bomberoId = esPiloto ? (session.user.bomberoId ?? null) : Number(body.bomberoId);
  const kilometraje = Number(body.kilometraje);
  const combustible: string = body.combustible;
  const aceite: string = body.aceite;
  const refrigerante: string = body.refrigerante;
  const estadoNeumaticos: string = (body.estadoNeumaticos || "").trim();
  const estadoCarroceria: string | null = body.estadoCarroceria?.trim() || null;
  const estadoSuspension: string | null = body.estadoSuspension?.trim() || null;
  const estadoEspejosVidrios: string | null = body.estadoEspejosVidrios?.trim() || null;
  const estadoCabina: string | null = body.estadoCabina?.trim() || null;
  const fotoKeys: string[] = Array.isArray(body.fotoKeys)
    ? body.fotoKeys.filter((k: unknown) => typeof k === "string").slice(0, MAX_FOTOS_REPORTE_PILOTO)
    : [];

  if (!vehiculoId) return NextResponse.json({ error: "Selecciona la unidad" }, { status: 400 });
  if (!bomberoId && !esPiloto) return NextResponse.json({ error: "Selecciona el piloto de turno" }, { status: 400 });
  if (!Number.isFinite(kilometraje) || kilometraje < 0)
    return NextResponse.json({ error: "Ingresa el kilometraje" }, { status: 400 });
  if (!(NIVELES_COMBUSTIBLE as readonly string[]).includes(combustible))
    return NextResponse.json({ error: "Selecciona el nivel de combustible" }, { status: 400 });
  if (!(NIVELES_ACEITE_REFRIGERANTE as readonly string[]).includes(aceite))
    return NextResponse.json({ error: "Selecciona el nivel de aceite" }, { status: 400 });
  if (!(NIVELES_ACEITE_REFRIGERANTE as readonly string[]).includes(refrigerante))
    return NextResponse.json({ error: "Selecciona el nivel de refrigerante" }, { status: 400 });
  if (!estadoNeumaticos) return NextResponse.json({ error: "Describe el estado de los neumáticos" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<{ id: number }>(`
      INSERT INTO reporte_piloto (
        fecha, vehiculo_id, bombero_id, kilometraje, combustible, aceite, refrigerante,
        estado_neumaticos, estado_carroceria, estado_suspension, estado_espejos_vidrios, estado_cabina,
        creado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `, [
      fecha, vehiculoId, bomberoId, kilometraje, combustible, aceite, refrigerante,
      estadoNeumaticos, estadoCarroceria, estadoSuspension, estadoEspejosVidrios, estadoCabina,
      Number(session.user.id),
    ]);
    const reporteId = rows[0].id;

    await client.query(
      `UPDATE vehiculo SET km_actual = GREATEST(COALESCE(km_actual, 0), $1), updated_at = NOW() WHERE id = $2`,
      [kilometraje, vehiculoId]
    );

    if (fotoKeys.length > 0) {
      const values: string[] = [];
      const params: unknown[] = [];
      let i = 1;
      fotoKeys.forEach((key, idx) => {
        values.push(`($${i++}, $${i++}, $${i++})`);
        params.push(reporteId, key, idx);
      });
      await client.query(
        `INSERT INTO reporte_piloto_foto (reporte_id, foto_key, orden) VALUES ${values.join(", ")}`,
        params
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ id: reporteId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[POST /api/reporte-piloto]", err);
    return NextResponse.json({ error: "Error al crear el reporte" }, { status: 500 });
  } finally {
    client.release();
  }
}
