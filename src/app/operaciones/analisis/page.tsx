import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { MapPin } from "lucide-react";
import { AnalisisCharts } from "@/components/ui-custom/AnalisisCharts";
import { AnalisisFiltros } from "@/components/ui-custom/AnalisisFiltros";

interface FiltrosAnalisis {
  anio:      number;
  mes:       number | null;  // null = todo el año
  distritoId: number | null;
}

async function getMetaFiltros() {
  const client = await pool.connect();
  try {
    const [aniosRes, distritosRes] = await Promise.all([
      client.query<{ anio: number }>(`
        SELECT DISTINCT EXTRACT(year FROM COALESCE(fecha_salida,fecha_despacho,created_at))::int AS anio
        FROM emergencia ORDER BY anio DESC
      `),
      client.query<{ id: number; nombre: string }>(
        `SELECT id, nombre FROM distrito ORDER BY nombre`
      ),
    ]);
    return { anios: aniosRes.rows.map(r => r.anio), distritos: distritosRes.rows };
  } finally {
    client.release();
  }
}

async function getAnalisisData(f: FiltrosAnalisis) {
  const client = await pool.connect();
  try {
    // Construir cláusula WHERE reutilizable
    const condAnio    = `EXTRACT(year FROM COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at)) = $1`;
    const condMes     = f.mes    ? `AND EXTRACT(month FROM COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at)) = $2` : "";
    const condDistrito = f.distritoId
      ? `AND e.distrito_id = $${f.mes ? 3 : 2}`
      : "";
    const params: (number)[] = [f.anio, ...(f.mes ? [f.mes] : []), ...(f.distritoId ? [f.distritoId] : [])];

    // Para queries sin JOIN a emergencia alias
    const condAnioSimple    = `EXTRACT(year FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $1`;
    const condMesSimple     = f.mes    ? `AND EXTRACT(month FROM COALESCE(fecha_salida,fecha_despacho,created_at)) = $2` : "";
    const condDistritoSimple = f.distritoId
      ? `AND distrito_id = $${f.mes ? 3 : 2}`
      : "";

    const [
      distritos, tiposDesc, tiposGrupo, vehiculos,
      tiempoXDescripcion, porHora, porDia, mesesStacked, resumen,
    ] = await Promise.all([

      // Por distrito
      client.query<{ nombre: string; total: string }>(`
        SELECT d.nombre, COUNT(*) AS total
        FROM emergencia e
        JOIN distrito d ON d.id = e.distrito_id
        WHERE ${condAnio} ${condMes} ${condDistrito}
        GROUP BY d.nombre ORDER BY total DESC
      `, params),

      // Por descripción completa (top 10)
      client.query<{ descripcion: string; total: string }>(`
        SELECT te.descripcion, COUNT(*) AS total
        FROM emergencia e
        JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE ${condAnio} ${condMes} ${condDistrito}
        GROUP BY te.descripcion ORDER BY total DESC LIMIT 10
      `, params),

      // Por categoría
      client.query<{ categoria: string; total: string }>(`
        SELECT SPLIT_PART(te.descripcion, ' / ', 1) AS categoria, COUNT(*) AS total
        FROM emergencia e
        JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE ${condAnio} ${condMes} ${condDistrito}
        GROUP BY categoria ORDER BY total DESC
      `, params),

      // Por vehículo
      client.query<{ codigo: string; tipo: string; total: string }>(`
        SELECT v.codigo, v.tipo, COUNT(ev.emergencia_id) AS total
        FROM vehiculo v
        LEFT JOIN emergencia_vehiculo ev ON ev.vehiculo_id = v.id
        LEFT JOIN emergencia e ON e.id = ev.emergencia_id
          AND ${condAnio} ${condMes} ${condDistrito}
        GROUP BY v.id, v.codigo, v.tipo
        ORDER BY total DESC
      `, params),

      // Tiempo por descripción
      client.query<{ descripcion: string; prom_mins: string; total: string }>(`
        SELECT te.descripcion,
               ROUND(AVG(EXTRACT(EPOCH FROM (e.fecha_llegada-e.fecha_despacho))/60)::numeric,1) AS prom_mins,
               COUNT(*) AS total
        FROM emergencia e
        JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE e.fecha_despacho IS NOT NULL AND e.fecha_llegada IS NOT NULL
          AND ${condAnio} ${condMes} ${condDistrito}
        GROUP BY te.descripcion
        HAVING COUNT(*) >= 2
        ORDER BY prom_mins DESC LIMIT 8
      `, params),

      // Por hora del día
      client.query<{ hora: string; total: string }>(`
        SELECT EXTRACT(HOUR FROM COALESCE(fecha_salida,fecha_despacho))::int AS hora,
               COUNT(*) AS total
        FROM emergencia
        WHERE ${condAnioSimple} ${condMesSimple} ${condDistritoSimple}
          AND COALESCE(fecha_salida,fecha_despacho) IS NOT NULL
        GROUP BY hora ORDER BY hora
      `, params),

      // Por día de la semana
      client.query<{ dow: string; total: string }>(`
        SELECT EXTRACT(DOW FROM COALESCE(fecha_salida,fecha_despacho,created_at))::int AS dow,
               COUNT(*) AS total
        FROM emergencia
        WHERE ${condAnioSimple} ${condMesSimple} ${condDistritoSimple}
        GROUP BY dow ORDER BY dow
      `, params),

      // Evolución mensual por categoría (solo si no se filtró por mes)
      f.mes ? Promise.resolve({ rows: [] as { mes: string; categoria: string; total: string }[] }) :
      client.query<{ mes: string; categoria: string; total: string }>(`
        SELECT TO_CHAR(DATE_TRUNC('month', COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at)),'Mon') AS mes,
               SPLIT_PART(te.descripcion,' / ',1) AS categoria,
               COUNT(*) AS total
        FROM emergencia e
        JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
        WHERE ${condAnio} ${condDistrito}
        GROUP BY DATE_TRUNC('month', COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at)), categoria
        ORDER BY DATE_TRUNC('month', COALESCE(e.fecha_salida,e.fecha_despacho,e.created_at))
      `, f.distritoId ? [f.anio, f.distritoId] : [f.anio]),

      // Resumen tiempos
      client.query<{ prom: string; min_t: string; max_t: string; con_datos: string }>(`
        SELECT
          ROUND(AVG(EXTRACT(EPOCH FROM (fecha_llegada-fecha_despacho))/60)::numeric,1) AS prom,
          MIN(EXTRACT(EPOCH FROM (fecha_llegada-fecha_despacho))/60)::int              AS min_t,
          MAX(EXTRACT(EPOCH FROM (fecha_llegada-fecha_despacho))/60)::int              AS max_t,
          COUNT(*) AS con_datos
        FROM emergencia
        WHERE fecha_despacho IS NOT NULL AND fecha_llegada IS NOT NULL
          AND ${condAnioSimple} ${condMesSimple} ${condDistritoSimple}
      `, params),
    ]);

    const horaMap = Object.fromEntries(porHora.rows.map(r => [Number(r.hora), Number(r.total)]));
    const horasFull = Array.from({ length: 24 }, (_, h) => ({
      hora: `${String(h).padStart(2,"0")}h`, total: horaMap[h] ?? 0,
    }));

    const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const diaMap = Object.fromEntries(porDia.rows.map(r => [Number(r.dow), Number(r.total)]));
    const diasFull = Array.from({ length: 7 }, (_, i) => ({ dia: DIAS[i], total: diaMap[i] ?? 0 }));

    const categorias = [...new Set(mesesStacked.rows.map(r => r.categoria))];
    const mesesMap: Record<string, Record<string,number>> = {};
    for (const r of mesesStacked.rows) {
      if (!mesesMap[r.mes]) mesesMap[r.mes] = {};
      mesesMap[r.mes][r.categoria] = Number(r.total);
    }
    const mesesData = Object.entries(mesesMap).map(([mes, cats]) => ({ mes, ...cats }));

    return {
      distritos:   distritos.rows.map(r => ({ nombre: r.nombre, total: Number(r.total) })),
      tiposDesc:   tiposDesc.rows.map(r => ({ descripcion: r.descripcion, total: Number(r.total) })),
      tiposGrupo:  tiposGrupo.rows.map(r => ({ categoria: r.categoria, total: Number(r.total) })),
      vehiculos:   vehiculos.rows.map(r => ({ codigo: r.codigo, tipo: r.tipo, total: Number(r.total) })),
      tiempoXTipo: tiempoXDescripcion.rows.map(r => ({ descripcion: r.descripcion, mins: Number(r.prom_mins), total: Number(r.total) })),
      porHora:     horasFull,
      porDia:      diasFull,
      mesesData,
      categorias,
      tiempos: {
        prom:     Number(resumen.rows[0]?.prom ?? 0),
        min:      Number(resumen.rows[0]?.min_t ?? 0),
        max:      Number(resumen.rows[0]?.max_t ?? 0),
        conDatos: Number(resumen.rows[0]?.con_datos ?? 0),
      },
      totalEmerg: distritos.rows.reduce((s,r) => s + Number(r.total), 0),
    };
  } finally {
    client.release();
  }
}

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string; distrito?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [meta, sp] = await Promise.all([getMetaFiltros(), searchParams]);

  const hoy        = new Date();
  const anio       = Number(sp.anio) || hoy.getFullYear();
  const mes        = sp.mes !== undefined ? (Number(sp.mes) || null) : hoy.getMonth() + 1;
  const distritoId = Number(sp.distrito) || null;

  const data = await getAnalisisData({ anio, mes, distritoId }).catch(() => null);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Error al cargar datos.</p>
    </div>
  );

  const distritoNombre = distritoId
    ? meta.distritos.find(d => d.id === distritoId)?.nombre
    : null;

  const subtitulo = [
    distritoNombre ?? "Todos los distritos",
    mes ? MESES_ES[mes] : `Año ${anio}`,
  ].join(" · ");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-700" />
            Análisis de Emergencias
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{subtitulo}</p>
        </div>

        <AnalisisFiltros
          anios={meta.anios}
          distritos={meta.distritos}
          anioActual={anio}
          mesActual={mes}
          distritoActual={distritoId}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total emergencias",     value: data.totalEmerg,                                           sub: subtitulo,                                      color: "text-red-600"   },
          { label: "T. respuesta promedio", value: data.tiempos.prom > 0 ? `${data.tiempos.prom} min` : "—", sub: `${data.tiempos.conDatos} partes con datos`,    color: "text-blue-600"  },
          { label: "Más rápido",            value: data.tiempos.min  > 0 ? `${data.tiempos.min} min`  : "—", sub: "tiempo mínimo registrado",                     color: "text-green-600" },
          { label: "Más lento",             value: data.tiempos.max  > 0 ? `${data.tiempos.max} min`  : "—", sub: "tiempo máximo registrado",                     color: "text-amber-600" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <AnalisisCharts
        distritos={data.distritos}
        tiposDesc={data.tiposDesc}
        tiposGrupo={data.tiposGrupo}
        vehiculos={data.vehiculos}
        tiempoXTipo={data.tiempoXTipo}
        porHora={data.porHora}
        porDia={data.porDia}
        mesesData={data.mesesData}
        categorias={data.categorias}
        anio={anio}
        mes={mes}
      />
    </div>
  );
}
