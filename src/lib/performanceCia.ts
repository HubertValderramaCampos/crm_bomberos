import pool from "./db";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_ES  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

export type Periodo = "dia" | "semana" | "mes";

export interface UnidadPerf {
  id: number;
  codigo: string;
  tipo: string | null;
  estado: string;              // estado actual (en vivo), para la alerta de "caída ahora"
  motivo: string | null;       // motivo actual (en vivo)
  total: number;                // servicios atendidos en el período
  minRespuesta: number | null;  // minutos promedio despacho → llegada
  horasPeriodo: number;         // horas del período cubiertas por historial de estado
  horasNoOperativo: number;     // horas NO operativa en el período (taller + motivos de falla)
  horasTaller: number;          // desglose: horas con estado EN TALLER
  horasMecanico: number;        // desglose: desperfectos mecánicos / equipamiento / combustible
  horasPersonal: number;        // desglose: falta de piloto / paramédico
  horasOtro: number;            // desglose: pruebas, asepsia, etc.
  disponibilidadPct: number;    // % del período que la unidad estuvo operativa
}

export interface RequenaContacto { apellidos: string; nombres: string; grado: string; telefono: string | null }

function pad(n: number) { return String(n).padStart(2, "0"); }
export function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function rangoPeriodo(periodo: Periodo, fechaAncla: string) {
  const [y, m, d] = fechaAncla.split("-").map(Number);
  let inicio: Date, fin: Date;

  if (periodo === "dia") {
    inicio = new Date(y, m - 1, d);
    fin    = new Date(y, m - 1, d + 1);
  } else if (periodo === "semana") {
    const ancla = new Date(y, m - 1, d);
    const dow = ancla.getDay(); // 0 = domingo
    const offsetLunes = dow === 0 ? -6 : 1 - dow;
    inicio = new Date(y, m - 1, d + offsetLunes);
    fin    = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7);
  } else {
    inicio = new Date(y, m - 1, 1);
    fin    = new Date(y, m, 1);
  }
  return { inicio, fin, inicioISO: toISO(inicio), finISO: toISO(fin) };
}

export function labelPeriodo(periodo: Periodo, inicio: Date, fin: Date) {
  if (periodo === "dia") {
    return `${DIAS_ES[inicio.getDay()]} ${inicio.getDate()} de ${MESES_ES[inicio.getMonth() + 1]} de ${inicio.getFullYear()}`;
  }
  if (periodo === "semana") {
    const finReal = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - 1);
    const mismoMes = inicio.getMonth() === finReal.getMonth();
    return mismoMes
      ? `Semana del ${inicio.getDate()} al ${finReal.getDate()} de ${MESES_ES[inicio.getMonth() + 1]} de ${inicio.getFullYear()}`
      : `Semana del ${inicio.getDate()} de ${MESES_ES[inicio.getMonth() + 1]} al ${finReal.getDate()} de ${MESES_ES[finReal.getMonth() + 1]} de ${finReal.getFullYear()}`;
  }
  return `${MESES_ES[inicio.getMonth() + 1]} ${inicio.getFullYear()}`;
}

export async function getPerformanceData(inicioISO: string, finISO: string) {
  const client = await pool.connect();
  try {
    const [serviciosRes, operativoRes, requena] = await Promise.all([
      // Servicios atendidos y tiempo de respuesta: se siguen midiendo desde las
      // emergencias reales atendidas por cada unidad.
      client.query<{
        id: number; codigo: string; tipo: string | null; estado: string; motivo: string | null;
        total: number; min_respuesta: number | null;
      }>(`
        SELECT
          v.id, v.codigo, v.tipo, v.estado, v.motivo,
          COUNT(e.id)::int AS total,
          AVG(EXTRACT(EPOCH FROM (e.fecha_llegada - e.fecha_despacho)) / 60)::float AS min_respuesta
        FROM vehiculo v
        LEFT JOIN emergencia_vehiculo ev ON ev.vehiculo_id = v.id
        LEFT JOIN emergencia e ON e.id = ev.emergencia_id
          AND COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at) >= $1::date
          AND COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at) <  $2::date
        WHERE v.estado != 'RETIRADO'
        GROUP BY v.id, v.codigo, v.tipo, v.estado, v.motivo
        ORDER BY v.codigo
      `, [inicioISO, finISO]),

      // Rendimiento = % del período que la unidad estuvo operativa, reconstruido
      // del historial real de estado (estado_compania_vehiculo, una foto cada
      // ~15-30 min). "No operativo" = EN TALLER, o cualquier motivo de falla
      // puesto aunque esté EN BASE (desperfectos, falta de piloto/paramédico,
      // etc.) — DESPACHO A EMERGENCIA no cuenta, es el momento de salir a
      // atender, no una falla.
      client.query<{
        vehiculo_id: number; horas_cubiertas: number; horas_no_operativo: number;
        horas_taller: number; horas_mecanico: number; horas_personal: number; horas_otro: number;
      }>(`
        WITH snaps AS (
          SELECT
            ecv.vehiculo_id, ec.created_at AS ts, ecv.estado,
            NULLIF(TRIM(ecv.motivo), '') AS motivo,
            LEAD(ec.created_at) OVER (PARTITION BY ecv.vehiculo_id ORDER BY ec.created_at) AS ts_next
          FROM estado_compania_vehiculo ecv
          JOIN estado_compania ec ON ec.id = ecv.estado_compania_id
          WHERE ec.created_at >= $1::date - INTERVAL '2 days' AND ec.created_at < $2::date
        ),
        segmentos AS (
          SELECT vehiculo_id, estado, motivo,
            GREATEST(ts, $1::date) AS desde,
            LEAST(COALESCE(ts_next, NOW()), $2::date, NOW()) AS hasta
          FROM snaps
          WHERE COALESCE(ts_next, NOW()) > $1::date AND ts < $2::date
        ),
        clasificados AS (
          SELECT *,
            EXTRACT(EPOCH FROM (hasta - desde)) / 3600 AS horas,
            CASE
              WHEN estado = 'EN TALLER' THEN 'TALLER'
              WHEN motivo IN ('DESPERFECTOS MECANICOS', 'EQUIPAMIENTO', 'COMBUSTIBLE') THEN 'MECANICO'
              WHEN motivo IN ('PILOTO', 'PARAMEDICO') THEN 'PERSONAL'
              WHEN motivo IN ('DE PRUEBA', 'ASEPSIA') THEN 'OTRO'
              ELSE NULL
            END AS categoria
          FROM segmentos WHERE hasta > desde
        )
        SELECT vehiculo_id,
          COALESCE(SUM(horas), 0)::float AS horas_cubiertas,
          COALESCE(SUM(horas) FILTER (WHERE categoria IS NOT NULL), 0)::float AS horas_no_operativo,
          COALESCE(SUM(horas) FILTER (WHERE categoria = 'TALLER'), 0)::float AS horas_taller,
          COALESCE(SUM(horas) FILTER (WHERE categoria = 'MECANICO'), 0)::float AS horas_mecanico,
          COALESCE(SUM(horas) FILTER (WHERE categoria = 'PERSONAL'), 0)::float AS horas_personal,
          COALESCE(SUM(horas) FILTER (WHERE categoria = 'OTRO'), 0)::float AS horas_otro
        FROM clasificados
        GROUP BY vehiculo_id
      `, [inicioISO, finISO]),

      client.query<RequenaContacto>(`
        SELECT apellidos, nombres, grado, telefono FROM bombero
        WHERE apellidos ILIKE '%REQUENA%' AND activo = true
        LIMIT 1
      `),
    ]);

    const operativoPorVehiculo = new Map(operativoRes.rows.map(r => [r.vehiculo_id, r]));

    const unidades: UnidadPerf[] = serviciosRes.rows.map(u => {
      const op = operativoPorVehiculo.get(u.id);
      const horasPeriodo = Math.max(1, Number(op?.horas_cubiertas ?? 0));
      const horasNoOperativo = Number(op?.horas_no_operativo ?? 0);
      return {
        id: u.id,
        codigo: u.codigo,
        tipo: u.tipo,
        estado: u.estado,
        motivo: u.motivo,
        total: Number(u.total),
        minRespuesta: u.min_respuesta != null ? Number(u.min_respuesta) : null,
        horasPeriodo,
        horasNoOperativo,
        horasTaller: Number(op?.horas_taller ?? 0),
        horasMecanico: Number(op?.horas_mecanico ?? 0),
        horasPersonal: Number(op?.horas_personal ?? 0),
        horasOtro: Number(op?.horas_otro ?? 0),
        disponibilidadPct: Math.max(0, Math.min(100, 100 - (horasNoOperativo / horasPeriodo) * 100)),
      };
    });

    return { unidades, requena: requena.rows[0] ?? null };
  } finally {
    client.release();
  }
}

export function linkWhatsappRequena(requena: RequenaContacto | null): string | null {
  const telefono = requena?.telefono ? requena.telefono.replace(/\D/g, "") : null;
  if (!telefono) return null;

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const contacto = requena ? `${requena.grado} ${requena.apellidos.trim()}` : "Tte. Requena";

  const mensaje = encodeURIComponent(`${saludo} ${contacto}, quisiera reservar guardia para el día de hoy.`);
  return `https://wa.me/51${telefono}?text=${mensaje}`;
}
