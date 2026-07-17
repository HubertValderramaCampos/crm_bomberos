import pool from "./db";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_ES  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

export type Periodo = "dia" | "semana" | "mes";

export interface RazonFuera { razon: string; horas: number }

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
  detalleNoOperativo: RazonFuera[]; // desglose por motivo exacto, de mayor a menor impacto
  disponibilidadPct: number;    // % del período que la unidad estuvo operativa
}

// Textos de la BD (fijos, ver el historial real en estado_compania_vehiculo)
// traducidos a algo legible para mostrar en el detalle de cada unidad.
const RAZON_LABEL: Record<string, string> = {
  "EN TALLER":               "En taller",
  "FUERA DE SERVICIO":       "Fuera de servicio",
  "DESPERFECTOS MECANICOS":  "Desperfectos mecánicos",
  "EQUIPAMIENTO":            "Equipamiento",
  "COMBUSTIBLE":             "Combustible",
  "PILOTO":                  "Falta de piloto",
  "PARAMEDICO":              "Falta de paramédico",
  "SIN PERSONAL":            "Sin personal disponible",
  "DE PRUEBA":               "Pruebas",
  "ASEPSIA":                 "Asepsia / limpieza",
};

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
      // ~15-30 min). "No operativo" = cualquier motivo de falla puesto aunque
      // esté EN BASE (desperfectos, falta de piloto/paramédico, etc.), o
      // cualquier estado que no sea EN BASE / EN EMERGENCIA (EN TALLER,
      // FUERA DE SERVICIO, etc.) — DESPACHO A EMERGENCIA no cuenta, es el
      // momento de salir a atender, no una falla. Se agrupa por el motivo
      // EXACTO (no en 4 categorías) para poder mostrar el detalle de cada causa.
      client.query<{ vehiculo_id: number; razon: string | null; horas: number }>(`
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
              WHEN motivo IN ('DESPERFECTOS MECANICOS', 'EQUIPAMIENTO', 'COMBUSTIBLE', 'PILOTO', 'PARAMEDICO', 'DE PRUEBA', 'ASEPSIA', 'SIN PERSONAL') THEN motivo
              WHEN estado NOT IN ('EN BASE', 'EN EMERGENCIA') THEN estado
              ELSE NULL
            END AS razon
          FROM segmentos WHERE hasta > desde
        )
        SELECT vehiculo_id, razon, SUM(horas)::float AS horas
        FROM clasificados
        GROUP BY vehiculo_id, razon
      `, [inicioISO, finISO]),

      client.query<RequenaContacto>(`
        SELECT apellidos, nombres, grado, telefono FROM bombero
        WHERE apellidos ILIKE '%REQUENA%' AND activo = true
        LIMIT 1
      `),
    ]);

    // Agrupar las filas planas (vehiculo_id, razon, horas) por vehículo
    const porVehiculo = new Map<number, { horasCubiertas: number; horasNoOperativo: number; detalle: RazonFuera[] }>();
    for (const row of operativoRes.rows) {
      const horas = Number(row.horas);
      const acc = porVehiculo.get(row.vehiculo_id) ?? { horasCubiertas: 0, horasNoOperativo: 0, detalle: [] };
      acc.horasCubiertas += horas;
      if (row.razon) {
        acc.horasNoOperativo += horas;
        acc.detalle.push({ razon: RAZON_LABEL[row.razon] ?? row.razon, horas });
      }
      porVehiculo.set(row.vehiculo_id, acc);
    }

    const unidades: UnidadPerf[] = serviciosRes.rows.map(u => {
      const op = porVehiculo.get(u.id);
      const horasPeriodo = Math.max(1, op?.horasCubiertas ?? 0);
      const horasNoOperativo = op?.horasNoOperativo ?? 0;
      const detalleNoOperativo = (op?.detalle ?? []).sort((a, b) => b.horas - a.horas);
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
        detalleNoOperativo,
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
