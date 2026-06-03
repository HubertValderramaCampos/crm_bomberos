import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tipo       = searchParams.get("tipo") ?? "";
  const actividadId= searchParams.get("actividad_id") ?? "";
  const bomberoId  = searchParams.get("bombero_id") ?? "";
  const anio       = searchParams.get("anio") ?? String(new Date().getFullYear());

  const conds: string[] = [`EXTRACT(year FROM a.fecha) = ${Number(anio)}`];
  if (tipo)        conds.push(`a.tipo = '${tipo.replace(/'/g, "''")}'`);
  if (actividadId) conds.push(`a.id = ${Number(actividadId)}`);
  if (bomberoId)   conds.push(`p.bombero_id = ${Number(bomberoId)}`);

  const where = conds.join(" AND ");

  const [detalleRes, resumenRes, rankingRes, actividadesRes] = await Promise.all([
    // Detalle de asistencias
    pool.query(`
      SELECT a.id AS actividad_id, a.fecha::text, a.tipo, a.descripcion,
             b.id AS bombero_id, b.apellidos, b.nombres, b.grado, b.codigo,
             p.asistio, p.justificacion, p.agregado_al_finalizar
      FROM programacion_participante p
      JOIN programacion_actividad a ON a.id = p.actividad_id
      JOIN bombero b ON b.id = p.bombero_id
      WHERE a.finalizado = true AND ${where}
      ORDER BY a.fecha DESC, b.apellidos
    `),

    // Resumen por actividad
    pool.query(`
      SELECT a.id, a.fecha::text, a.tipo, a.descripcion,
             COUNT(p.bombero_id)::int                                          AS total,
             COUNT(p.bombero_id) FILTER (WHERE p.asistio = true)::int          AS asistieron,
             COUNT(p.bombero_id) FILTER (WHERE p.asistio = false)::int         AS faltaron,
             COUNT(p.bombero_id) FILTER (WHERE p.asistio IS NULL)::int         AS sin_marcar
      FROM programacion_actividad a
      JOIN programacion_participante p ON p.actividad_id = a.id
      WHERE a.finalizado = true AND ${where.replace(/p\./g, "p.")}
      GROUP BY a.id, a.fecha, a.tipo, a.descripcion
      ORDER BY a.fecha DESC
    `),

    // Ranking de inasistencias por bombero
    pool.query(`
      SELECT b.id, b.apellidos, b.nombres, b.grado, b.codigo,
             COUNT(*) FILTER (WHERE p.asistio = false)::int   AS faltas,
             COUNT(*) FILTER (WHERE p.asistio = true)::int    AS asistencias,
             COUNT(*)::int                                     AS total_convocado
      FROM programacion_participante p
      JOIN programacion_actividad a ON a.id = p.actividad_id
      JOIN bombero b ON b.id = p.bombero_id
      WHERE a.finalizado = true AND ${where}
      GROUP BY b.id, b.apellidos, b.nombres, b.grado, b.codigo
      ORDER BY faltas DESC, b.apellidos
      LIMIT 20
    `),

    // Lista de actividades finalizadas para el filtro
    pool.query(`
      SELECT DISTINCT a.id, a.fecha::text, a.tipo, a.descripcion
      FROM programacion_actividad a
      JOIN programacion_participante p ON p.actividad_id = a.id
      WHERE a.finalizado = true
        AND EXTRACT(year FROM a.fecha) = ${Number(anio)}
        ${tipo ? `AND a.tipo = '${tipo.replace(/'/g, "''")}'` : ""}
      ORDER BY a.fecha DESC
    `),
  ]);

  return NextResponse.json({
    detalle:      detalleRes.rows,
    resumen:      resumenRes.rows,
    ranking:      rankingRes.rows,
    actividades:  actividadesRes.rows,
  });
}
