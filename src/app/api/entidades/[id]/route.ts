import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;

  const [entRes, actRes, ofRes, donRes] = await Promise.all([
    pool.query(`SELECT * FROM entidad WHERE id = $1`, [id]),
    pool.query(`SELECT id, fecha::text, tipo, descripcion, hora_inicio::text, efectivos_asistentes
                FROM programacion_actividad WHERE entidad_id = $1 ORDER BY fecha DESC LIMIT 10`, [id]),
    pool.query(`SELECT id, fecha::text, 'institucional' AS origen, entidad, resumen FROM oficio_institucional WHERE entidad_id = $1
                UNION ALL
                SELECT id, fecha::text, 'varios', entidad, resumen FROM oficio_varios WHERE entidad_id = $1
                ORDER BY fecha DESC LIMIT 10`, [id]),
    pool.query(`SELECT id, fecha::text, tipo_donacion FROM donacion WHERE entidad_id = $1 ORDER BY fecha DESC LIMIT 10`, [id]),
  ]);

  if (!entRes.rows[0]) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json({ ...entRes.rows[0], actividades: actRes.rows, oficios: ofRes.rows, donaciones: donRes.rows });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const { nombre, tipo, contacto, telefono, correo, direccion, notas } = await req.json();

  await pool.query(
    `UPDATE entidad SET nombre=$1, tipo=$2, contacto=$3, telefono=$4, correo=$5, direccion=$6, notas=$7 WHERE id=$8`,
    [nombre, tipo, contacto ?? null, telefono ?? null, correo ?? null, direccion ?? null, notas ?? null, id]
  );
  return NextResponse.json({ ok: true });
}
