import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const anio   = Number(searchParams.get("anio"))  || new Date().getFullYear();
  const mes    = Number(searchParams.get("mes"))   || null;
  const semana = searchParams.get("semana") || null;
  const dia    = searchParams.get("dia")    || null;

  // rangoInicio / rangoFin: expresiones SQL sin parámetros extra,
  // los parámetros $1 / $2 son los de rangoParams
  let rangoInicio: string;
  let rangoFin: string;
  let rangoParams: (string | number)[];

  if (dia) {
    rangoInicio = `$1::date`;
    rangoFin    = `$1::date + INTERVAL '1 day'`;
    rangoParams = [dia];
  } else if (semana) {
    rangoInicio = `$1::date`;
    rangoFin    = `$1::date + INTERVAL '7 days'`;
    rangoParams = [semana];
  } else if (mes) {
    rangoInicio = `DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1))`;
    rangoFin    = `DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1)) + INTERVAL '1 month'`;
    rangoParams = [anio, mes];
  } else {
    rangoInicio = `DATE_TRUNC('year', MAKE_DATE($1::int, 1, 1))`;
    rangoFin    = `DATE_TRUNC('year', MAKE_DATE($1::int, 1, 1)) + INTERVAL '1 year'`;
    rangoParams = [anio];
  }

  // CTE base reutilizable: expande cada turno en franjas
  // Un turno = registro en_turno seguido de su siguiente registro franco
  const cteBase = `
    WITH entradas AS (
      SELECT bombero_id, cambiado_en AS inicio
      FROM bombero_historial_estado
      WHERE estado_nuevo = 'en_turno'
        AND cambiado_en >= ${rangoInicio}
        AND cambiado_en <  ${rangoFin}
    ),
    salidas AS (
      SELECT bombero_id, cambiado_en AS fin
      FROM bombero_historial_estado
      WHERE estado_nuevo = 'franco'
    ),
    turnos AS (
      SELECT e.bombero_id,
             e.inicio,
             MIN(s.fin) AS fin
      FROM entradas e
      JOIN salidas s ON s.bombero_id = e.bombero_id AND s.fin > e.inicio
      GROUP BY e.bombero_id, e.inicio
    )
  `;

  const [horasRes, diasRes, semanasRes] = await Promise.all([
    // Por hora: cuántos bomberos estaban activos en cada franja horaria
    pool.query<{ hora: number; total: number }>(`
      ${cteBase},
      franjas_hora AS (
        SELECT generate_series(
          DATE_TRUNC('hour', inicio),
          fin - INTERVAL '1 second',
          INTERVAL '1 hour'
        ) AS franja, bombero_id
        FROM turnos
      )
      SELECT EXTRACT(HOUR FROM franja)::int AS hora,
             COUNT(DISTINCT bombero_id)::int AS total
      FROM franjas_hora
      GROUP BY hora ORDER BY hora
    `, rangoParams),

    // Por día
    semana || dia
      ? pool.query<{ fecha: string; total: number }>(`
          ${cteBase},
          franjas_dia AS (
            SELECT generate_series(
              DATE_TRUNC('day', inicio),
              fin - INTERVAL '1 second',
              INTERVAL '1 day'
            )::date AS fecha, bombero_id
            FROM turnos
          )
          SELECT fecha,
                 COUNT(DISTINCT bombero_id)::int AS total
          FROM franjas_dia
          GROUP BY fecha ORDER BY fecha
        `, rangoParams)
      : pool.query<{ dow: number; total: number }>(`
          ${cteBase},
          franjas_dia AS (
            SELECT generate_series(
              DATE_TRUNC('day', inicio),
              fin - INTERVAL '1 second',
              INTERVAL '1 day'
            ) AS franja, bombero_id
            FROM turnos
          )
          SELECT EXTRACT(DOW FROM franja)::int AS dow,
                 COUNT(DISTINCT bombero_id)::int AS total
          FROM franjas_dia
          GROUP BY dow ORDER BY dow
        `, rangoParams),

    // Semanas disponibles para el mes seleccionado
    mes
      ? pool.query<{ semana_inicio: string }>(`
          SELECT DISTINCT DATE_TRUNC('week', cambiado_en)::date AS semana_inicio
          FROM bombero_historial_estado
          WHERE estado_nuevo = 'en_turno'
            AND cambiado_en >= DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1))
            AND cambiado_en <  DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1)) + INTERVAL '1 month'
          ORDER BY semana_inicio
        `, [anio, mes])
      : Promise.resolve({ rows: [] as { semana_inicio: string }[] }),
  ]);

  const DIAS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  const horaMap = Object.fromEntries(horasRes.rows.map(r => [r.hora, r.total]));
  const porHora = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2,"0")}h`,
    total: horaMap[h] ?? 0,
  }));

  let porDia: { dia: string; total: number }[];
  if (semana || dia) {
    porDia = (diasRes.rows as { fecha: string; total: number }[]).map(r => {
      const f = r.fecha as unknown;
      const isoFecha = f instanceof Date ? (f as Date).toISOString().slice(0, 10) : String(f).slice(0, 10);
      return {
        dia: new Date(isoFecha + "T00:00:00Z").toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }),
        total: r.total,
      };
    });
  } else {
    const diaMap = Object.fromEntries((diasRes.rows as { dow: number; total: number }[]).map(r => [r.dow, r.total]));
    porDia = Array.from({ length: 7 }, (_, i) => ({ dia: DIAS_ES[i], total: diaMap[i] ?? 0 }));
  }

  return NextResponse.json({
    porHora,
    porDia,
    semanas: semanasRes.rows.map(r => {
      const v = r.semana_inicio as unknown;
      if (v instanceof Date) return (v as Date).toISOString().slice(0, 10);
      return String(v).slice(0, 10);
    }),
    modoSemana: !!(semana || dia),
  });
}
