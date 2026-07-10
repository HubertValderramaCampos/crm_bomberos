import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { InicioFormativoClient } from "@/components/ui-custom/InicioFormativoClient";

export default async function InicioFormativoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const categoria = session.user.categoria ?? "BOMBERO";
  const esFormativo = ["ASPIRANTE", "POSTULANTE"].includes(categoria);
  if (!esFormativo) redirect("/inicio");

  const bomberoId = session.user.bomberoId;
  if (!bomberoId) redirect("/inicio");

  // Datos del bombero
  const bRes = await pool.query<{ apellidos: string; nombres: string; grado: string | null; categoria: string }>(
    `SELECT apellidos, nombres, grado, categoria FROM bombero WHERE id = $1`, [bomberoId]
  );
  const bombero = bRes.rows[0];

  // Asistencias recientes
  const asistRes = await pool.query<{ id: number; fecha: string; hora_entrada: string; hora_salida: string | null }>(
    `SELECT id, fecha::text,
            (hora_entrada AT TIME ZONE 'America/Lima')::text AS hora_entrada,
            (hora_salida  AT TIME ZONE 'America/Lima')::text AS hora_salida
     FROM asistencia_formativa
     WHERE bombero_id = $1
     ORDER BY fecha DESC, hora_entrada DESC
     LIMIT 20`,
    [bomberoId]
  );

  // Notas
  const notasRes = await pool.query<{
    id: number; titulo: string; contenido: string | null;
    calificacion: number | null; fecha: string; creado_por_codigo: string | null;
  }>(
    `SELECT n.id, n.titulo, n.contenido, n.calificacion, n.fecha::text,
            u.codigo AS creado_por_codigo
     FROM formativa_nota n
     LEFT JOIN usuario u ON u.id = n.creado_por
     WHERE n.bombero_id = $1
     ORDER BY n.fecha DESC, n.id DESC`,
    [bomberoId]
  );

  // Total asistencias
  const totalRes = await pool.query<{ total: number; este_mes: number }>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE))::int AS este_mes
     FROM asistencia_formativa WHERE bombero_id = $1`,
    [bomberoId]
  );

  const nombres = session.user.nombres ?? bombero?.nombres ?? "Aspirante";
  const primerApellido = (bombero?.apellidos ?? nombres).split(",")[0].trim();
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <InicioFormativoClient
      saludo={saludo}
      nombre={primerApellido}
      categoria={categoria}
      asistencias={asistRes.rows}
      notas={notasRes.rows}
      totalAsistencias={totalRes.rows[0]?.total ?? 0}
      estesMes={totalRes.rows[0]?.este_mes ?? 0}
    />
  );
}
