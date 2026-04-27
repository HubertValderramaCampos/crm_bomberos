import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { CalendarCheck, Users, Clock, Siren, TrendingUp, ChevronRight } from "lucide-react";
import { calcularRacha } from "@/lib/racha";
import { AsistenciasCharts } from "@/components/ui-custom/AsistenciasCharts";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_CORTO = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

async function getAsistenciasData(mes: number, anio: number) {
  const client = await pool.connect();
  try {
    const [resumenMeses, detalleMes, topBomberos, porGrado, emergReales, cumplimiento] = await Promise.all([

      // Resumen por mes (todos los meses disponibles)
      client.query<{
        mes: number; anio: number; bomberos: string;
        prom_horas: string; total_horas: string;
        total_dias: string;
      }>(`
        SELECT mes, anio,
               COUNT(DISTINCT bombero_id)             AS bomberos,
               ROUND(AVG(horas_acumuladas)::numeric,1) AS prom_horas,
               SUM(horas_acumuladas)                   AS total_horas,
               SUM(dias_asistidos)                     AS total_dias
        FROM asistencia_mensual
        GROUP BY mes, anio
        ORDER BY anio DESC, mes DESC
      `),

      // Detalle del mes seleccionado — todos los bomberos
      client.query<{
        id: number; codigo: string; grado: string; apellidos: string; nombres: string;
        horas_acumuladas: number; dias_asistidos: number; dias_guardia: number; num_emergencias: number;
      }>(`
        SELECT b.id, b.codigo, b.grado, b.apellidos, b.nombres,
               am.horas_acumuladas, am.dias_asistidos, am.dias_guardia, am.num_emergencias
        FROM asistencia_mensual am
        JOIN bombero b ON b.id = am.bombero_id
        WHERE am.mes = $1 AND am.anio = $2 AND b.activo = true
        ORDER BY am.horas_acumuladas DESC
      `, [mes, anio]),

      // Top 10 bomberos del mes
      client.query<{
        apellidos: string; nombres: string; grado: string;
        horas_acumuladas: number; dias_asistidos: number;
      }>(`
        SELECT b.apellidos, b.nombres, b.grado,
               am.horas_acumuladas, am.dias_asistidos
        FROM asistencia_mensual am
        JOIN bombero b ON b.id = am.bombero_id
        WHERE am.mes = $1 AND am.anio = $2 AND b.activo = true
          AND am.horas_acumuladas > 0
        ORDER BY am.horas_acumuladas DESC LIMIT 10
      `, [mes, anio]),

      // Distribución por grado
      client.query<{ grado: string; total: string; prom_horas: string }>(`
        SELECT b.grado,
               COUNT(DISTINCT am.bombero_id) AS total,
               ROUND(AVG(am.horas_acumuladas)::numeric, 1) AS prom_horas
        FROM asistencia_mensual am
        JOIN bombero b ON b.id = am.bombero_id
        WHERE am.mes = $1 AND am.anio = $2 AND b.activo = true
        GROUP BY b.grado ORDER BY prom_horas DESC
      `, [mes, anio]),

      // Conteo real de emergencias del mes (partes reales, no participaciones)
      client.query<{ mes: number; anio: number; total: string }>(`
        SELECT
          EXTRACT(month FROM COALESCE(fecha_salida,fecha_despacho,created_at))::int AS mes,
          EXTRACT(year  FROM COALESCE(fecha_salida,fecha_despacho,created_at))::int AS anio,
          COUNT(*) AS total
        FROM emergencia
        WHERE tipo = 'EMERGENCIA'
        GROUP BY 1, 2
        ORDER BY 2 DESC, 1 DESC
      `),

      // Cumplimiento reglamentario por grado
      client.query<{ grado: string; cumple: string; no_cumple: string; total: string }>(`
        SELECT b.grado,
               COUNT(*) FILTER (WHERE am.horas_acumuladas >= CASE b.grado
                 WHEN 'Seccionario'    THEN 30
                 WHEN 'SubTeniente CBP' THEN 20
                 WHEN 'Teniente CBP'   THEN 20
                 WHEN 'Capitán CBP'    THEN 10
                 WHEN 'Tnte Brigadier' THEN 5
                 WHEN 'Brigadier'      THEN 1
                 ELSE 20 END) AS cumple,
               COUNT(*) FILTER (WHERE am.horas_acumuladas < CASE b.grado
                 WHEN 'Seccionario'    THEN 30
                 WHEN 'SubTeniente CBP' THEN 20
                 WHEN 'Teniente CBP'   THEN 20
                 WHEN 'Capitán CBP'    THEN 10
                 WHEN 'Tnte Brigadier' THEN 5
                 WHEN 'Brigadier'      THEN 1
                 ELSE 20 END) AS no_cumple,
               COUNT(*) AS total
        FROM asistencia_mensual am
        JOIN bombero b ON b.id = am.bombero_id
        WHERE am.mes = $1 AND am.anio = $2 AND b.activo = true
        GROUP BY b.grado ORDER BY total DESC
      `, [mes, anio]),
    ]);

    const resumen = resumenMeses.rows;
    const actual  = resumen.find(r => r.mes === mes && r.anio === anio);

    // Conteo real de emergencias por mes (partes reales)
    const emergMap = new Map(emergReales.rows.map(r => [`${r.anio}-${r.mes}`, Number(r.total)]));
    const emergMesActual = emergMap.get(`${anio}-${mes}`) ?? 0;

    // Calcular cumplimiento global
    const totalCumple   = cumplimiento.rows.reduce((s, r) => s + Number(r.cumple), 0);
    const totalNoCumple = cumplimiento.rows.reduce((s, r) => s + Number(r.no_cumple), 0);

    return {
      resumenMeses: resumen.map(r => ({
        label: `${MESES_CORTO[r.mes]} ${r.anio}`,
        mes: r.mes, anio: r.anio,
        bomberos:   Number(r.bomberos),
        promHoras:  Number(r.prom_horas),
        totalHoras: Number(r.total_horas),
        totalDias:  Number(r.total_dias),
        totalEmerg: emergMap.get(`${r.anio}-${r.mes}`) ?? 0,
      })),
      actual: actual ? {
        bomberos:   Number(actual.bomberos),
        promHoras:  Number(actual.prom_horas),
        totalHoras: Number(actual.total_horas),
        totalDias:  Number(actual.total_dias),
        totalEmerg: emergMesActual,
      } : null,
      detalleMes:  detalleMes.rows,
      topBomberos: topBomberos.rows,
      porGrado:    porGrado.rows.map(r => ({ grado: r.grado, total: Number(r.total), promHoras: Number(r.prom_horas) })),
      cumplimiento: cumplimiento.rows.map(r => ({
        grado: r.grado, cumple: Number(r.cumple), noCumple: Number(r.no_cumple), total: Number(r.total),
      })),
      totalCumple, totalNoCumple,
    };
  } finally {
    client.release();
  }
}

export default async function AsistenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const esBombero = session.user.rol === "BOMBERO";
  const bomberoId = session.user.bomberoId ?? null;

  // Obtener último mes disponible + racha si es bombero
  const client = await pool.connect();
  const [ultimoMes, racha] = await Promise.all([
    client.query<{ mes: number; anio: number }>(
      `SELECT mes, anio FROM asistencia_mensual ORDER BY anio DESC, mes DESC LIMIT 1`
    ).finally(() => client.release()),
    esBombero && bomberoId ? calcularRacha(bomberoId).catch(() => null) : Promise.resolve(null),
  ]);

  const puedeVerBeneficios = !esBombero || (racha?.rachaActual ?? 0) >= 2;

  const sp = await searchParams;
  const defMes  = ultimoMes.rows[0]?.mes  ?? new Date().getMonth() + 1;
  const defAnio = ultimoMes.rows[0]?.anio ?? new Date().getFullYear();
  const mes  = Number(sp.mes)  || defMes;
  const anio = Number(sp.anio) || defAnio;

  const data = await getAsistenciasData(mes, anio).catch(() => null);
  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Error al cargar datos de asistencia.</p>
    </div>
  );

  const pctCumple = (data.totalCumple + data.totalNoCumple) > 0
    ? Math.round((data.totalCumple / (data.totalCumple + data.totalNoCumple)) * 100)
    : 0;

  return (
    <div className="space-y-4 pb-6">

      {/* Header + selector de mes */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-red-700" />
            Informe de Asistencias
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {MESES_ES[mes]} {anio} — cumplimiento reglamentario y actividad mensual
          </p>
        </div>

        {/* Selector de mes */}
        <div className="flex items-center gap-2 flex-wrap max-w-full">
          {data.resumenMeses.map(r => (
            <Link
              key={`${r.mes}-${r.anio}`}
              href={`/operaciones/asistencias?mes=${r.mes}&anio=${r.anio}`}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                r.mes === mes && r.anio === anio
                  ? "bg-red-700 text-white border-red-700"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { icon: Users,        label: "Bomberos activos",   value: data.actual?.bomberos ?? "—",                           sub: `con registro ${MESES_ES[mes]}`,           color: "text-blue-600"   },
          { icon: Clock,        label: "Horas totales",       value: data.actual ? `${data.actual.totalHoras.toLocaleString()}h` : "—", sub: `promedio: ${data.actual?.promHoras ?? "—"}h`, color: "text-purple-600" },
          { icon: CalendarCheck,label: "Días de asistencia",  value: data.actual?.totalDias ?? "—",                          sub: "suma de todos los bomberos",             color: "text-amber-600"  },
          { icon: Siren,        label: "Emergencias",         value: data.actual?.totalEmerg ?? "—",                         sub: "partes reales del mes",                  color: "text-red-600"    },
          { icon: TrendingUp,   label: "Cumple reglamento",   value: `${pctCumple}%`,                                        sub: `${data.totalCumple} de ${data.totalCumple + data.totalNoCumple}`, color: pctCumple >= 70 ? "text-green-600" : "text-amber-600" },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <AsistenciasCharts
        resumenMeses={data.resumenMeses}
        porGrado={data.porGrado}
        cumplimiento={data.cumplimiento}
        topBomberos={data.topBomberos.map(b => ({
          nombre: `${b.apellidos.split(",")[0].trim()}, ${b.nombres.split(" ")[0]}`,
          horas: b.horas_acumuladas,
          dias: b.dias_asistidos,
        }))}
        mesActual={mes}
        anioActual={anio}
        puedeVerBeneficios={puedeVerBeneficios}
      />

      {/* Tabla detalle — solo para operativos */}
      {!esBombero && <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Detalle individual</h2>
            <p className="text-xs text-gray-400 mt-0.5">{data.detalleMes.length} bomberos con registro en {MESES_ES[mes]}</p>
          </div>
          <Link
            href={`/operaciones/personal?mes=${mes}&anio=${anio}`}
            className="flex items-center gap-1 text-xs text-red-700 hover:underline font-medium"
          >
            Ver en Bomberos <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["#","Bombero","Grado","Días","Guardias","Horas","Emergencias","Cumplimiento"].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.detalleMes.map((b, i) => {
                const meta = { "Seccionario": 30, "SubTeniente CBP": 20, "Teniente CBP": 20, "Capitán CBP": 10, "Tnte Brigadier": 5, "Brigadier": 1 }[b.grado] ?? 20;
                const pct  = Math.min(100, Math.round((b.horas_acumuladas / meta) * 100));
                const ok   = b.horas_acumuladas >= meta;
                return (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3">
                      <Link href={`/operaciones/personal/${b.id}`} className="text-xs font-semibold text-gray-900 hover:text-red-700 transition-colors">
                        {b.apellidos}, {b.nombres}
                      </Link>
                      <p className="text-[10px] text-gray-400 font-mono">{b.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{b.grado}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{b.dias_asistidos ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{b.dias_guardia ?? "—"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900">{b.horas_acumuladas ?? "—"}h</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{b.num_emergencias ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ok ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${ok ? "text-green-600" : pct >= 60 ? "text-amber-600" : "text-red-500"}`}>
                          {pct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {data.detalleMes.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">Sin datos para este período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}

    </div>
  );
}
