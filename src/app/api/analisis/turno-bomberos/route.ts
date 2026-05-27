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

  const [horasRes, diasRes, semanasRes] = await Promise.all([
    // Por hora: bomberos únicos
    pool.query<{ hora: number; total: number }>(`
      SELECT EXTRACT(HOUR FROM cambiado_en)::int AS hora,
             COUNT(DISTINCT bombero_id)::int AS total
      FROM bombero_historial_estado
      WHERE estado_nuevo = 'en_turno' AND ${whereHora}
      GROUP BY hora ORDER BY hora
    `, whereHoraParams),

    // Por día: bomberos únicos (DOW si es mes/año, fecha real si es semana/día)
    semana || dia
      ? pool.query<{ fecha: string; total: number }>(`
          SELECT cambiado_en::date AS fecha,
                 COUNT(DISTINCT bombero_id)::int AS total
          FROM bombero_historial_estado
          WHERE estado_nuevo = 'en_turno' AND ${whereDia}
          GROUP BY fecha ORDER BY fecha
        `, whereDiaParams)
      : pool.query<{ dow: number; total: number }>(`
          SELECT EXTRACT(DOW FROM cambiado_en)::int AS dow,
                 COUNT(DISTINCT bombero_id)::int AS total
          FROM bombero_historial_estado
          WHERE estado_nuevo = 'en_turno' AND ${whereDia}
          GROUP BY dow ORDER BY dow
        `, whereDiaParams),

    // Semanas disponibles (solo cuando hay mes seleccionado)
    mes
      ? pool.query<{ semana_inicio: string }>(`
          SELECT DISTINCT DATE_TRUNC('week', cambiado_en)::date AS semana_inicio
          FROM bombero_historial_estado
          WHERE estado_nuevo = 'en_turno'
            AND EXTRACT(year FROM cambiado_en) = $1
            AND EXTRACT(month FROM cambiado_en) = $2
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
    porDia = (diasRes.rows as { fecha: string; total: number }[]).map(r => ({
      dia: new Date(r.fecha).toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" }),
      total: r.total,
    }));
  } else {
    const diaMap = Object.fromEntries((diasRes.rows as { dow: number; total: number }[]).map(r => [r.dow, r.total]));
    porDia = Array.from({ length: 7 }, (_, i) => ({ dia: DIAS_ES[i], total: diaMap[i] ?? 0 }));
  }

  return NextResponse.json({
    porHora,
    porDia,
    semanas: semanasRes.rows.map(r => r.semana_inicio),
    modoSemana: !!(semana || dia),
  });
}
