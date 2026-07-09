import pool from "./db";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_ES  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

export type Periodo = "dia" | "semana" | "mes";

export interface UnidadPerf {
  id: number;
  codigo: string;
  tipo: string | null;
  estado: string;
  motivo: string | null;
  total: number;              // servicios atendidos en el período
  horasFuera: number;         // horas fuera de base en el período (incluye servicios aún en curso)
  minRespuesta: number | null; // minutos promedio despacho → llegada
  disponibilidadPct: number;  // % del período transcurrido que la unidad estuvo disponible en base
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
    const [unidadesRes, horasRes, requena] = await Promise.all([
      client.query<{
        id: number; codigo: string; tipo: string | null; estado: string; motivo: string | null;
        total: number; horas_fuera: number; min_respuesta: number | null;
      }>(`
        SELECT
          v.id, v.codigo, v.tipo, v.estado, v.motivo,
          COUNT(e.id)::int AS total,
          COALESCE(SUM(
            CASE
              WHEN e.fecha_salida IS NULL THEN 0
              WHEN e.fecha_retorno IS NOT NULL THEN EXTRACT(EPOCH FROM (e.fecha_retorno - e.fecha_salida)) / 3600
              -- Sigue "ATENDIENDO" sin retorno: cuenta como fuera de servicio ahora,
              -- topado a 48h para no disparar el total con partes viejos que quedaron sin cerrar.
              WHEN e.estado = 'ATENDIENDO' THEN LEAST(EXTRACT(EPOCH FROM (NOW() - e.fecha_salida)) / 3600, 48)
              ELSE 0
            END
          ), 0)::float AS horas_fuera,
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

      client.query<{ horas: number }>(
        `SELECT EXTRACT(EPOCH FROM (LEAST($2::timestamp, NOW()) - $1::timestamp)) / 3600 AS horas`,
        [inicioISO, finISO]
      ),

      client.query<RequenaContacto>(`
        SELECT apellidos, nombres, grado, telefono FROM bombero
        WHERE apellidos ILIKE '%REQUENA%' AND activo = true
        LIMIT 1
      `),
    ]);

    const horasPeriodo = Math.max(1, Number(horasRes.rows[0]?.horas ?? 1));

    const unidades: UnidadPerf[] = unidadesRes.rows.map(u => {
      const horasFuera = Number(u.horas_fuera);
      return {
        id: u.id,
        codigo: u.codigo,
        tipo: u.tipo,
        estado: u.estado,
        motivo: u.motivo,
        total: Number(u.total),
        horasFuera,
        minRespuesta: u.min_respuesta != null ? Number(u.min_respuesta) : null,
        disponibilidadPct: Math.max(0, Math.min(100, 100 - (horasFuera / horasPeriodo) * 100)),
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
