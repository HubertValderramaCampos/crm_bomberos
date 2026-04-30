import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [actRes, partRes] = await Promise.all([
    pool.query<{
      id: number; fecha: string; tipo: string; descripcion: string | null;
      lugar: string | null; es_capacitacion: boolean;
      hora_inicio: string | null; hora_fin: string | null; efectivos_asistentes: number;
      entidad_nombre: string | null;
    }>(`SELECT a.id, a.fecha::text, a.tipo, a.descripcion, a.lugar, a.es_capacitacion,
               a.hora_inicio::text, a.hora_fin::text, a.efectivos_asistentes,
               e.nombre AS entidad_nombre
        FROM programacion_actividad a
        LEFT JOIN entidad e ON e.id = a.entidad_id
        WHERE a.id = $1`, [id]),

    pool.query<{ bombero_id: number; apellidos: string; nombres: string; grado: string; asistio: boolean | null }>(`
      SELECT p.bombero_id, b.apellidos, b.nombres, b.grado, p.asistio
      FROM programacion_participante p
      JOIN bombero b ON b.id = p.bombero_id
      WHERE p.actividad_id = $1
      ORDER BY b.apellidos
    `, [id]),
  ]);

  if (!actRes.rows[0]) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ...actRes.rows[0], participantes: partRes.rows });
}
