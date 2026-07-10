import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde") ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const hasta = searchParams.get("hasta") ?? new Date().toISOString().slice(0, 10);
  const bomberoId = searchParams.get("bombero_id") ?? "";

  const conds = [`af.fecha BETWEEN '${desde}' AND '${hasta}'`];
  if (bomberoId) conds.push(`af.bombero_id = ${Number(bomberoId)}`);
  const where = conds.join(" AND ");

  const [resumenRes, detalleRes, porDiaRes, porTipoRes, horariosRes, bomberosList] = await Promise.all([
    // Resumen por bombero
    pool.query(`
      SELECT b.id, b.apellidos, b.nombres, b.grado, b.categoria,
             COUNT(af.id)::int                                          AS total,
             COUNT(af.id) FILTER (WHERE af.tipo = 'regular')::int       AS regulares,
             COUNT(af.id) FILTER (WHERE af.tipo = 'extra')::int          AS extras,
             COUNT(af.id) FILTER (WHERE af.hora_salida IS NOT NULL)::int AS con_salida
      FROM bombero b
      LEFT JOIN asistencia_formativa af ON af.bombero_id = b.id AND ${where.replace('af.bombero_id', 'b.id')}
      WHERE b.activo = true AND b.categoria IN ('ASPIRANTE', 'POSTULANTE')
        ${bomberoId ? `AND b.id = ${Number(bomberoId)}` : ""}
      GROUP BY b.id, b.apellidos, b.nombres, b.grado, b.categoria
      ORDER BY total DESC, b.apellidos
    `),

    // Detalle de asistencias
    pool.query(`
      SELECT af.id, af.fecha::text,
             (af.hora_entrada AT TIME ZONE 'America/Lima')::text AS hora_entrada,
             (af.hora_salida  AT TIME ZONE 'America/Lima')::text AS hora_salida,
             af.tipo, af.motivo,
             b.apellidos, b.nombres, b.grado, b.codigo
      FROM asistencia_formativa af
      JOIN bombero b ON b.id = af.bombero_id
      WHERE ${where}
      ORDER BY af.fecha DESC, af.hora_entrada DESC
    `),

    // Asistencias por día de semana
    pool.query(`
      SELECT EXTRACT(DOW FROM af.fecha)::int AS dia, COUNT(*)::int AS total
      FROM asistencia_formativa af
      JOIN bombero b ON b.id = af.bombero_id
      WHERE ${where} AND b.categoria IN ('ASPIRANTE','POSTULANTE')
      GROUP BY dia ORDER BY dia
    `),

    // Por tipo (regular vs extra)
    pool.query(`
      SELECT af.tipo, COUNT(*)::int AS total
      FROM asistencia_formativa af
      JOIN bombero b ON b.id = af.bombero_id
      WHERE ${where} AND b.categoria IN ('ASPIRANTE','POSTULANTE')
      GROUP BY af.tipo
    `),

    // Horarios programados
    pool.query(`
      SELECT id, dia_semana, hora_inicio::text, hora_fin::text, descripcion, activo
      FROM formativa_horario WHERE activo = true ORDER BY dia_semana, hora_inicio
    `),

    // Lista de aspirantes/postulantes para filtro
    pool.query(`
      SELECT id, apellidos, nombres, categoria
      FROM bombero WHERE activo = true AND categoria IN ('ASPIRANTE','POSTULANTE')
      ORDER BY apellidos
    `),
  ]);

  return NextResponse.json({
    resumen:   resumenRes.rows,
    detalle:   detalleRes.rows,
    porDia:    porDiaRes.rows,
    porTipo:   porTipoRes.rows,
    horarios:  horariosRes.rows,
    bomberos:  bomberosList.rows,
  });
}
