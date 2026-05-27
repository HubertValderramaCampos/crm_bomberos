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
  const semana = searchParams.get("semana") || null; // fecha ISO inicio de semana YYYY-MM-DD
  const dia    = searchParams.get("dia")    || null; // fecha ISO YYYY-MM-DD

  let whereHora: string;
  let whereHoraParams: (string | number)[];

  let whereDia: string;
  let whereDiaParams: (string | number)[];

  if (dia) {
    // Día específico: datos por hora de ese día
    whereHora = `cambiado_en >= $1::date AND cambiado_en < ($1::date + INTERVAL '1 day')`;
    whereHoraParams = [dia];
    whereDia = whereHora;
    whereDiaParams = [dia];
  } else if (semana) {
    // Semana específica: datos por hora y por día de esa semana
    whereHora = `cambiado_en >= $1::date AND cambiado_en < ($1::date + INTERVAL '7 days')`;
    whereHoraParams = [semana];
    whereDia = whereHora;
    whereDiaParams = [semana];
  } else if (mes) {
    // Mes completo: datos por hora y por día agregados
    whereHora = `EXTRACT(year FROM cambiado_en) = $1 AND EXTRACT(month FROM cambiado_en) = $2`;
    whereHoraParams = [anio, mes];
    whereDia = whereHora;
    whereDiaParams = [anio, mes];
  } else {
    // Todo el año
    whereHora = `EXTRACT(year FROM cambiado_en) = $1`;
    whereHoraParams = [anio];
    whereDia = whereHora;
    whereDiaParams = [anio];
  }

  // Construir WHERE para el rango completo (usado en joins de entrada/salida)
  let rangoWhere: string;
  let rangoParams: (string | number)[];
  if (dia) {
    rangoWhere = `$1::date AND ($1::date + INTERVAL '1 day')`;
    rangoParams = [dia];
  } else if (semana) {
    rangoWhere = `$1::date AND ($1::date + INTERVAL '7 days')`;
    rangoParams = [semana];
  } else if (mes) {
    rangoWhere = `DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1)) AND DATE_TRUNC('month', MAKE_DATE($1::int, $2::int, 1)) + INTERVAL '1 month'`;
    rangoParams = [anio, mes];
  } else {
    rangoWhere = `DATE_TRUNC('year', MAKE_DATE($1::int, 1, 1)) AND DATE_TRUNC('year', MAKE_DATE($1::int, 1, 1)) + INTERVAL '1 year'`;
    rangoParams = [anio];
  }

  const [horasRes, diasRes, semanasRes] = await Promise.all([
    // Por hora: bomberos activos en esa franja (entrada <= franja < salida)
    pool.query<{ hora: number; total: number }>(`
      WITH entradas AS (
        SELECT bombero_id, cambiado_en AS inicio
        FROM bombero_historial_estado
        WHERE estado_nuevo = 'en_turno'
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
      ),
      franjas AS (
        SELECT generate_series(
          DATE_TRUNC('hour', inicio),
          fin - INTERVAL '1 second',
          INTERVAL '1 hour'
        ) AS franja, bombero_id
        FROM turnos
        WHERE inicio >= ${rangoWhere}
      )
      SELECT EXTRACT(HOUR FROM franja)::int AS hora,
             COUNT(DISTINCT bombero_id)::int AS total
      FROM franjas
      GROUP BY hora ORDER BY hora
    `, rangoParams),

    // Por día: bomberos únicos (DOW si es mes/año, fecha real si es semana/día)
    semana || dia
      ? pool.query<{ fecha: string; total: number }>(`
          WITH entradas AS (
            SELECT bombero_id, cambiado_en AS inicio
            FROM bombero_historial_estado
            WHERE estado_nuevo = 'en_turno'
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
          ),
          franjas AS (
            SELECT generate_series(
              DATE_TRUNC('day', inicio),
              fin - INTERVAL '1 second',
              INTERVAL '1 day'
            )::date AS fecha, bombero_id
            FROM turnos
            WHERE inicio >= ${rangoWhere}
          )
          SELECT fecha,
                 COUNT(DISTINCT bombero_id)::int AS total
          FROM franjas
          GROUP BY fecha ORDER BY fecha
        `, rangoParams)
      : pool.query<{ dow: number; total: number }>(`
          WITH entradas AS (
            SELECT bombero_id, cambiado_en AS inicio
            FROM bombero_historial_estado
            WHERE estado_nuevo = 'en_turno'
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
          ),
          franjas AS (
            SELECT generate_series(
              DATE_TRUNC('day', inicio),
              fin - INTERVAL '1 second',
              INTERVAL '1 day'
            ) AS franja, bombero_id
            FROM turnos
            WHERE inicio >= ${rangoWhere}
          )
          SELECT EXTRACT(DOW FROM franja)::int AS dow,
                 COUNT(DISTINCT bombero_id)::int AS total
          FROM franjas
          GROUP BY dow ORDER BY dow
        `, rangoParams),

    // Semanas disponibles (solo cuando hay mes seleccionado)
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

  // Construir array de 24h con zeros donde no hay dato
  const horaMap = Object.fromEntries(horasRes.rows.map(r => [r.hora, r.total]));
  const porHora = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2,"0")}h`,
    total: horaMap[h] ?? 0,
  }));

  // Construir array de días
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
      // pg returns ::date columns as Date objects at runtime despite the string type
      const v = r.semana_inicio as unknown;
      if (v instanceof Date) return (v as Date).toISOString().slice(0, 10);
      return String(v).slice(0, 10);
    }),
    modoSemana: !!(semana || dia),
  });
}
