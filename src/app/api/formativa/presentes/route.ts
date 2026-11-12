import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ROLES_SUPERVISION_FORMATIVA } from "@/lib/roles";
import { ahoraLima, fechaLima } from "@/lib/fechaLima";

export const dynamic = "force-dynamic";

const TZ = "America/Lima";

// Una sesión abierta más vieja que esto casi seguro es una salida que no se
// marcó, no alguien que sigue en el cuartel. Se muestra igual (sigue siendo
// una entrada sin cerrar), pero con aviso para que el jefe la interprete.
const HORAS_SOSPECHA          = 12;
const HORAS_SOSPECHA_NOCTURNA = 18;

interface PersonaRow {
  id: number; apellidos: string; nombres: string; codigo: string | null;
  categoria: string; foto_url: string | null;
}
interface PresenteRow extends PersonaRow {
  asistencia_id: number; fecha: string; hora_entrada: string; minutos: number;
  tipo: string; motivo: string | null; guardia_nocturna: boolean;
}
interface SalidaRow extends PersonaRow {
  fecha: string; hora_entrada: string; hora_salida: string;
  tipo: string; motivo: string | null; guardia_nocturna: boolean;
}

// Quiénes están en la compañía AHORA: aspirantes/postulantes con una entrada
// sin salida, de hoy o de ayer (hora de Lima). Es la misma regla que usa el
// marcado de asistencia para decidir si hay "una sesión abierta": más atrás
// de ayer hay filas viejas nunca cerradas que no significan presencia.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!ROLES_SUPERVISION_FORMATIVA.includes(session.user.rol))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const hoy  = fechaLima(ahoraLima());
  const ayer = fechaLima(new Date(ahoraLima().getTime() - 24 * 60 * 60 * 1000));

  const [presentesRes, salieronRes, todosRes, ahoraRes] = await Promise.all([
    // hora_entrada es TIME WITH TIME ZONE (sin fecha). Para obtener el
    // instante real de la entrada se convierte primero a hora de Lima y se
    // suma a `fecha` (que ya es la fecha de Lima); combinarla en UTC a secas
    // daría un día de menos para toda entrada posterior a las 19:00.
    pool.query<PresenteRow>(
      `WITH abiertas AS (
         SELECT DISTINCT ON (af.bombero_id) af.*
         FROM asistencia_formativa af
         WHERE af.hora_salida IS NULL AND af.fecha IN ($1::date, $2::date)
         ORDER BY af.bombero_id, af.fecha DESC, af.hora_entrada DESC
       )
       SELECT b.id, b.apellidos, b.nombres, b.codigo, b.categoria, b.foto_url,
              a.id AS asistencia_id, a.fecha::text,
              (a.hora_entrada AT TIME ZONE $3)::text AS hora_entrada,
              GREATEST(0, ROUND(EXTRACT(EPOCH FROM (now() - (a.fecha + (a.hora_entrada AT TIME ZONE $3)))) / 60))::int AS minutos,
              a.tipo, a.motivo, a.guardia_nocturna
       FROM abiertas a
       JOIN bombero b ON b.id = a.bombero_id
       WHERE b.activo = true AND b.categoria IN ('ASPIRANTE', 'POSTULANTE')
       ORDER BY a.fecha DESC, a.hora_entrada DESC`,
      [hoy, ayer, TZ]
    ),

    // Ya salieron: sesiones cerradas de hoy, más las guardias nocturnas de
    // ayer que ya cerraron (salieron esta mañana).
    pool.query<SalidaRow>(
      `SELECT DISTINCT ON (b.id)
              b.id, b.apellidos, b.nombres, b.codigo, b.categoria, b.foto_url,
              a.fecha::text,
              (a.hora_entrada AT TIME ZONE $3)::text AS hora_entrada,
              (a.hora_salida  AT TIME ZONE $3)::text AS hora_salida,
              a.tipo, a.motivo, a.guardia_nocturna
       FROM asistencia_formativa a
       JOIN bombero b ON b.id = a.bombero_id
       WHERE a.hora_salida IS NOT NULL
         AND (a.fecha = $1::date OR (a.fecha = $2::date AND a.guardia_nocturna))
         AND b.activo = true AND b.categoria IN ('ASPIRANTE', 'POSTULANTE')
       ORDER BY b.id, a.fecha DESC, a.hora_salida DESC`,
      [hoy, ayer, TZ]
    ),

    pool.query<PersonaRow>(
      `SELECT id, apellidos, nombres, codigo, categoria, foto_url
       FROM bombero
       WHERE activo = true AND categoria IN ('ASPIRANTE', 'POSTULANTE')
       ORDER BY apellidos, nombres`
    ),

    pool.query<{ hora: string }>(`SELECT to_char(now() AT TIME ZONE $1, 'HH24:MI:SS') AS hora`, [TZ]),
  ]);

  const presentes = presentesRes.rows.map(p => ({
    ...p,
    posible_salida_no_marcada:
      p.minutos > (p.guardia_nocturna ? HORAS_SOSPECHA_NOCTURNA : HORAS_SOSPECHA) * 60,
  }));
  const idsPresentes = new Set(presentes.map(p => p.id));

  // Quien salió y volvió a entrar aparece solo como presente.
  const salieron = salieronRes.rows
    .filter(s => !idsPresentes.has(s.id))
    .sort((a, b) => (b.fecha + b.hora_salida).localeCompare(a.fecha + a.hora_salida));
  const idsSalieron = new Set(salieron.map(s => s.id));

  const sinRegistro = todosRes.rows.filter(b => !idsPresentes.has(b.id) && !idsSalieron.has(b.id));

  return NextResponse.json(
    {
      fecha: hoy,
      hora: ahoraRes.rows[0]?.hora ?? null,
      presentes,
      salieron,
      sin_registro: sinRegistro,
      total: todosRes.rows.length,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
