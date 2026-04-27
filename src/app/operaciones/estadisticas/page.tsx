import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrendingUp, Siren, Clock, Truck, Flame, Users } from "lucide-react";
import pool from "@/lib/db";
import { EstadisticasCharts } from "@/components/ui-custom/EstadisticasCharts";
import { EstadisticasFiltros } from "@/components/ui-custom/EstadisticasFiltros";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

async function getAniosDisponibles() {
  const client = await pool.connect();
  try {
    const res = await client.query<{ anio: number }>(`
      SELECT DISTINCT EXTRACT(year FROM COALESCE(fecha_salida, fecha_despacho, created_at))::int AS anio
      FROM emergencia ORDER BY anio DESC
    `);
    return res.rows.map(r => r.anio);
  } finally {
    client.release();
  }
}

async function getEstadisticas(anio: number, mes: number | null) {
  const client = await pool.connect();
  try {
    // Condición de rango según si hay filtro de mes o no
    const whereAnio = mes
      ? `EXTRACT(year FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = ${anio}
         AND EXTRACT(month FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = ${mes}`
      : `EXTRACT(year FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = ${anio}`;

    const whereAnioE = mes
      ? `EXTRACT(year FROM COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at)) = ${anio}
         AND EXTRACT(month FROM COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at)) = ${mes}`
      : `EXTRACT(year FROM COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at)) = ${anio}`;

    const [dias, categorias, respuesta, vehiculos, mando, resumen, tendenciaMensual] = await Promise.all([

      // Actividad diaria — 60 días si todo el año, o el mes completo si hay filtro
      client.query<{ dia: string; total: string }>(
        mes
          ? `SELECT DATE(COALESCE(fecha_salida,fecha_despacho,created_at))::text AS dia, COUNT(*) AS total
             FROM emergencia
             WHERE EXTRACT(year FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $1
               AND EXTRACT(month FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $2
             GROUP BY dia ORDER BY dia`
          : `SELECT DATE(COALESCE(fecha_salida,fecha_despacho,created_at))::text AS dia, COUNT(*) AS total
             FROM emergencia
             WHERE COALESCE(fecha_salida,fecha_despacho,created_at) >= NOW() - INTERVAL '60 days'
             GROUP BY dia ORDER BY dia`,
        mes ? [anio, mes] : []
      ),

      // Por categoría
      client.query<{ categoria: string; total: string }>(`
        SELECT SPLIT_PART(te.descripcion, ' / ', 1) AS categoria, COUNT(*) AS total
        FROM emergencia e
        JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE ${whereAnioE}
        GROUP BY categoria ORDER BY total DESC
      `),

      // Tiempo de respuesta
      client.query<{ categoria: string; mins: string; total: string }>(`
        SELECT SPLIT_PART(te.descripcion, ' / ', 1) AS categoria,
               ROUND(AVG(EXTRACT(EPOCH FROM (e.fecha_llegada - e.fecha_despacho))/60)::numeric, 1) AS mins,
               COUNT(*) AS total
        FROM emergencia e
        JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE e.fecha_despacho IS NOT NULL AND e.fecha_llegada IS NOT NULL
          AND ${whereAnioE}
        GROUP BY categoria HAVING COUNT(*) >= 2
        ORDER BY mins DESC
      `),

      // Uso de vehículos
      client.query<{ codigo: string; tipo: string; total: string }>(`
        SELECT v.codigo, v.tipo, COUNT(ev.emergencia_id) AS total
        FROM vehiculo v
        LEFT JOIN emergencia_vehiculo ev ON ev.vehiculo_id = v.id
        LEFT JOIN emergencia e ON e.id = ev.emergencia_id
          AND ${whereAnioE.replace(/e\./g, "e.")}
        GROUP BY v.id, v.codigo, v.tipo
        ORDER BY total DESC
      `),

      // Top al mando
      client.query<{ nombre: string; veces: string }>(`
        SELECT b.grado || ' ' || b.apellidos || ', ' || b.nombres AS nombre,
               COUNT(*) AS veces
        FROM emergencia e
        JOIN bombero b ON b.id = e.al_mando_id
        WHERE ${whereAnioE}
        GROUP BY b.id, b.grado, b.apellidos, b.nombres
        ORDER BY veces DESC LIMIT 8
      `),

      // KPIs resumen
      client.query<{
        total: string; atendiendo: string; cerradas: string; prom_respuesta: string;
        hora_pico: string; efectivos_prom: string;
      }>(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (
            WHERE estado = 'ATENDIENDO' AND fecha_ingreso IS NULL
              AND COALESCE(fecha_salida,fecha_despacho) >= NOW() - INTERVAL '24 hours'
          ) AS atendiendo,
          COUNT(*) FILTER (WHERE estado = 'CERRADO') AS cerradas,
          ROUND(AVG(EXTRACT(EPOCH FROM (fecha_llegada - fecha_despacho))/60)
            FILTER (WHERE fecha_llegada IS NOT NULL AND fecha_despacho IS NOT NULL)::numeric, 1)
            AS prom_respuesta,
          (SELECT EXTRACT(hour FROM COALESCE(fecha_salida,fecha_despacho,created_at))::int::text || 'h'
           FROM emergencia WHERE ${whereAnio}
           GROUP BY EXTRACT(hour FROM COALESCE(fecha_salida,fecha_despacho,created_at))
           ORDER BY COUNT(*) DESC LIMIT 1) AS hora_pico,
          ROUND(AVG(numero_efectivos) FILTER (WHERE numero_efectivos > 0)::numeric, 1) AS efectivos_prom
        FROM emergencia
        WHERE ${whereAnio}
      `),

      // Tendencia mensual — solo cuando NO hay filtro de mes
      mes ? Promise.resolve({ rows: [] as { mes: string; total: string; cerradas: string }[] }) :
      client.query<{ mes: string; total: string; cerradas: string }>(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', COALESCE(fecha_salida,fecha_despacho,created_at)), 'Mon') AS mes,
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE estado = 'CERRADO') AS cerradas
        FROM emergencia
        WHERE EXTRACT(year FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $1
        GROUP BY DATE_TRUNC('month', COALESCE(fecha_salida,fecha_despacho,created_at))
        ORDER BY DATE_TRUNC('month', COALESCE(fecha_salida,fecha_despacho,created_at))
      `, [anio]),
    ]);

    return {
      dias:             dias.rows.map(r => ({ dia: r.dia, total: Number(r.total) })),
      categorias:       categorias.rows.map(r => ({ categoria: r.categoria, total: Number(r.total) })),
      respuesta:        respuesta.rows.map(r => ({ categoria: r.categoria, mins: Number(r.mins), total: Number(r.total) })),
      vehiculos:        vehiculos.rows.map(r => ({ codigo: r.codigo, tipo: r.tipo, total: Number(r.total) })),
      mando:            mando.rows.map(r => ({ nombre: r.nombre, veces: Number(r.veces) })),
      tendenciaMensual: tendenciaMensual.rows.map(r => ({ mes: r.mes, total: Number(r.total), cerradas: Number(r.cerradas) })),
      resumen: {
        total:         Number(resumen.rows[0]?.total ?? 0),
        atendiendo:    Number(resumen.rows[0]?.atendiendo ?? 0),
        cerradas:      Number(resumen.rows[0]?.cerradas ?? 0),
        promRespuesta: Number(resumen.rows[0]?.prom_respuesta) || 0,
        horaPico:      resumen.rows[0]?.hora_pico ?? null,
        efectivosProm: Number(resumen.rows[0]?.efectivos_prom) || 0,
      },
    };
  } finally {
    client.release();
  }
}

export default async function EstadisticasPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const hoy = new Date();
  const [anios, sp] = await Promise.all([getAniosDisponibles(), searchParams]);

  const anio = Number(sp.anio) || hoy.getFullYear();
  const mes  = sp.mes !== undefined ? (Number(sp.mes) || null) : hoy.getMonth() + 1;

  if (anios.length === 0) anios.push(anio);

  const data = await getEstadisticas(anio, mes).catch(() => null);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Error al cargar estadísticas.</p>
    </div>
  );

  const { resumen } = data;
  const periodoLabel = mes ? `${MESES_ES[mes]} ${anio}` : `${anio}`;
  const topCategoria = data.categorias[0];

  return (
    <div className="space-y-4 pb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-700" />
            Estadísticas Operacionales
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Resumen de actividad y rendimiento — {periodoLabel}
          </p>
        </div>
        <EstadisticasFiltros anios={anios} anioActual={anio} mesActual={mes} />
      </div>

      {/* KPIs — 4 tarjetas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Siren, label: `Total ${periodoLabel}`, color: "text-red-600",
            value: resumen.total,
            sub: `${resumen.atendiendo > 0 ? `${resumen.atendiendo} activas · ` : ""}${resumen.cerradas} cerradas`,
          },
          {
            icon: Flame, label: "Tipo más frecuente", color: "text-orange-600",
            value: topCategoria?.total ?? "—",
            sub: topCategoria?.categoria ?? "sin datos",
          },
          {
            icon: Clock, label: "T. Respuesta prom.", color: "text-blue-600",
            value: resumen.promRespuesta > 0 ? `${resumen.promRespuesta} min` : "—",
            sub: resumen.promRespuesta > 0 ? "despacho → llegada" : "sin datos suficientes",
          },
          {
            icon: Users, label: "Hora pico", color: "text-purple-600",
            value: resumen.horaPico ?? "—",
            sub: resumen.efectivosProm > 0 ? `${resumen.efectivosProm} ef. prom. por salida` : "promedio por salida",
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold leading-tight">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight">{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <EstadisticasCharts
        dias={data.dias}
        categorias={data.categorias}
        respuesta={data.respuesta}
        vehiculos={data.vehiculos}
        mando={data.mando}
        tendenciaMensual={data.tendenciaMensual}
        anio={anio}
        mes={mes}
      />

    </div>
  );
}
