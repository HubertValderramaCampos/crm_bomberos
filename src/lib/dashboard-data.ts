import pool from "./db";

export interface DashboardStats {
  bomberos: number;
  enTurno: number;
  vehiculosOperativos: number;
  vehiculosTotal: number;
  emergenciasHoy: number;
  emergenciasAtendiendo: number;
  emergenciasMes: number;
  emergenciasAnio: number;
  cursosActivos: number;
  capacitacionesCompletadas: number;
  capacitacionesProgramadas: number;
  capacitacionesParticipantes: number;
  pilotosActivos: number;
}

export interface EmergenciaRow {
  id: number;
  numero_parte: string;
  tipo_desc: string | null;
  tipo_raw: string;
  estado: string;
  direccion: string | null;
  fecha_salida: string | null;
  fecha_despacho: string | null;
  piloto_nombre: string | null;
  vehiculos: string[];
}

export interface EmergenciaPorMes {
  mes: string;
  total: number;
}

export interface EmergenciaPorTipo {
  name: string;
  value: number;
}

export interface AsistenciaEfectivo {
  nombre: string;
  grado: string;
  asistencias: number;
}

export interface AsistenciaMes {
  mes: string;
  total: number;
}

export interface AsistenciaGrado {
  grado: string;
  total: number;
}

export interface CapacitacionRow {
  id: number;
  empresa: string;
  tema: string;
  fecha: string;
  num_participantes: number | null;
  horas: number | null;
}

export interface CapacitacionMes {
  mes: string;
  participantes: number;
}

export interface VehiculoRow {
  id: number;
  codigo: string;
  tipo: string;
  estado: string;
  motivo: string | null;
  km_actual: number | null;
}

const COLORES_TIPO = [
  "#dc2626","#f59e0b","#ea580c","#2563eb",
  "#7c3aed","#059669","#65a30d","#6b7280",
];

export async function getDashboardStats(): Promise<DashboardStats> {
  const client = await pool.connect();
  try {
    const [
      bomberos,
      enTurno,
      vehiculos,
      emergHoy,
      emergAtendiendo,
      emergMes,
      emergAnio,
      cursos,
      capacComp,
      capacProg,
      capacPart,
      pilotos,
    ] = await Promise.all([
      client.query<{ count: string }>("SELECT COUNT(*) FROM bombero WHERE activo = true"),
      client.query<{ count: string }>("SELECT COUNT(*) FROM bombero_estado_actual WHERE estado = 'en_turno'"),
      client.query<{ estado: string; count: string }>("SELECT estado, COUNT(*) FROM vehiculo GROUP BY estado"),
      client.query<{ count: string }>(
        "SELECT COUNT(*) FROM emergencia WHERE DATE(COALESCE(fecha_salida, fecha_despacho, created_at)) = CURRENT_DATE"
      ),
      client.query<{ count: string }>("SELECT COUNT(*) FROM emergencia WHERE estado = 'ATENDIENDO' AND fecha_retorno IS NULL AND COALESCE(fecha_salida, fecha_despacho) >= NOW() - INTERVAL '6 hours'"),
      client.query<{ count: string }>(
        "SELECT COUNT(*) FROM emergencia WHERE DATE_TRUNC('month', COALESCE(fecha_salida, fecha_despacho, created_at)) = DATE_TRUNC('month', CURRENT_DATE)"
      ),
      client.query<{ count: string }>(
        "SELECT COUNT(*) FROM emergencia WHERE EXTRACT(year FROM COALESCE(fecha_salida, fecha_despacho, created_at)) = EXTRACT(year FROM CURRENT_DATE)"
      ),
      client.query<{ count: string }>("SELECT COUNT(*) FROM curso_externo"),
      client.query<{ count: string }>("SELECT COUNT(*) FROM capacitacion_brindada WHERE fecha <= CURRENT_DATE"),
      client.query<{ count: string }>("SELECT COUNT(*) FROM capacitacion_brindada WHERE fecha > CURRENT_DATE"),
      client.query<{ total: string }>(
        "SELECT COALESCE(SUM(num_participantes),0) AS total FROM capacitacion_brindada WHERE fecha <= CURRENT_DATE"
      ),
      client.query<{ count: string }>("SELECT COUNT(*) FROM piloto_rentado WHERE activo = true"),
    ]);

    const vMap = Object.fromEntries(vehiculos.rows.map((r) => [r.estado, Number(r.count)]));

    return {
      bomberos: Number(bomberos.rows[0].count),
      enTurno: Number(enTurno.rows[0].count),
      vehiculosOperativos: vMap["en_base"] ?? 0,
      vehiculosTotal: vehiculos.rows.reduce((s, r) => s + Number(r.count), 0),
      emergenciasHoy: Number(emergHoy.rows[0].count),
      emergenciasAtendiendo: Number(emergAtendiendo.rows[0].count),
      emergenciasMes: Number(emergMes.rows[0].count),
      emergenciasAnio: Number(emergAnio.rows[0].count),
      cursosActivos: Number(cursos.rows[0].count),
      capacitacionesCompletadas: Number(capacComp.rows[0].count),
      capacitacionesProgramadas: Number(capacProg.rows[0].count),
      capacitacionesParticipantes: Number(capacPart.rows[0].total),
      pilotosActivos: Number(pilotos.rows[0].count),
    };
  } finally {
    client.release();
  }
}

export async function getEmergenciasHoy(): Promise<EmergenciaRow[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<{
      id: number; numero_parte: string; tipo_desc: string | null;
      tipo_raw: string; estado: string; direccion: string | null;
      fecha_salida: string | null; fecha_despacho: string | null; piloto_nombre: string | null;
    }>(`
      SELECT e.id, e.numero_parte,
             te.descripcion AS tipo_desc, e.tipo AS tipo_raw,
             e.estado, e.direccion, e.fecha_salida, e.fecha_despacho, e.piloto_nombre
      FROM emergencia e
      LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
      WHERE DATE(COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at)) = CURRENT_DATE
      ORDER BY COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at) DESC
      LIMIT 30
    `);

    const ids = res.rows.map((r) => r.id);
    let vehiculosMap: Record<number, string[]> = {};
    if (ids.length > 0) {
      const vRes = await client.query<{ emergencia_id: number; codigo: string }>(`
        SELECT ev.emergencia_id, v.codigo
        FROM emergencia_vehiculo ev
        JOIN vehiculo v ON v.id = ev.vehiculo_id
        WHERE ev.emergencia_id = ANY($1)
        UNION ALL
        SELECT eve.emergencia_id, eve.codigo_vehiculo AS codigo
        FROM emergencia_vehiculo_externo eve
        WHERE eve.emergencia_id = ANY($1)
      `, [ids]);
      vehiculosMap = vRes.rows.reduce((acc, r) => {
        if (!acc[r.emergencia_id]) acc[r.emergencia_id] = [];
        acc[r.emergencia_id].push(r.codigo);
        return acc;
      }, {} as Record<number, string[]>);
    }

    return res.rows.map((r) => ({
      ...r,
      vehiculos: vehiculosMap[r.id] ?? [],
    }));
  } finally {
    client.release();
  }
}

export async function getEmergenciasPorMes(): Promise<EmergenciaPorMes[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<{ mes: string; total: string }>(`
      SELECT TO_CHAR(DATE_TRUNC('month', COALESCE(fecha_salida, fecha_despacho, created_at)), 'Mon') AS mes,
             COUNT(*) AS total
      FROM emergencia
      WHERE EXTRACT(year FROM COALESCE(fecha_salida, fecha_despacho, created_at)) = EXTRACT(year FROM CURRENT_DATE)
      GROUP BY DATE_TRUNC('month', COALESCE(fecha_salida, fecha_despacho, created_at))
      ORDER BY DATE_TRUNC('month', COALESCE(fecha_salida, fecha_despacho, created_at))
    `);
    return res.rows.map((r) => ({ mes: r.mes, total: Number(r.total) }));
  } finally {
    client.release();
  }
}

export async function getEmergenciasPorTipo(): Promise<EmergenciaPorTipo[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<{ nombre: string; total: string }>(`
      SELECT COALESCE(te.descripcion, e.tipo) AS nombre, COUNT(*) AS total
      FROM emergencia e
      LEFT JOIN tipo_emergencia te ON te.id = e.tipo_emergencia_id
      WHERE EXTRACT(year FROM COALESCE(e.fecha_salida, e.fecha_despacho, e.created_at)) = EXTRACT(year FROM CURRENT_DATE)
      GROUP BY COALESCE(te.descripcion, e.tipo)
      ORDER BY total DESC
      LIMIT 8
    `);
    return res.rows.map((r, i) => ({
      name: r.nombre,
      value: Number(r.total),
      color: COLORES_TIPO[i] ?? "#6b7280",
    }));
  } finally {
    client.release();
  }
}

export async function getAsistenciaMensual(): Promise<AsistenciaMes[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<{ mes: string; total: string }>(`
      SELECT TO_CHAR(DATE_TRUNC('month', fecha), 'Mon') AS mes,
             COUNT(DISTINCT bombero_id) AS total
      FROM asistencia_diaria
      WHERE EXTRACT(year FROM fecha) = EXTRACT(year FROM CURRENT_DATE)
      GROUP BY DATE_TRUNC('month', fecha)
      ORDER BY DATE_TRUNC('month', fecha)
    `);
    return res.rows.map((r) => ({ mes: r.mes, total: Number(r.total) }));
  } finally {
    client.release();
  }
}

export async function getAsistenciaEfectivos(): Promise<AsistenciaEfectivo[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<{ nombre: string; grado: string; asistencias: string }>(`
      SELECT b.apellidos || ', ' || b.nombres AS nombre,
             b.grado,
             COUNT(ad.id) AS asistencias
      FROM bombero b
      LEFT JOIN asistencia_diaria ad ON ad.bombero_id = b.id
        AND DATE_TRUNC('month', ad.fecha) = DATE_TRUNC('month', CURRENT_DATE)
      WHERE b.activo = true
      GROUP BY b.id, b.apellidos, b.nombres, b.grado
      ORDER BY asistencias DESC, b.apellidos
      LIMIT 20
    `);
    return res.rows.map((r) => ({
      nombre: r.nombre,
      grado: r.grado,
      asistencias: Number(r.asistencias),
    }));
  } finally {
    client.release();
  }
}

export async function getAsistenciaPorGrado(): Promise<AsistenciaGrado[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<{ grado: string; total: string }>(`
      SELECT b.grado,
             COUNT(DISTINCT ad.bombero_id) AS total
      FROM bombero b
      LEFT JOIN asistencia_diaria ad ON ad.bombero_id = b.id
        AND DATE_TRUNC('month', ad.fecha) = DATE_TRUNC('month', CURRENT_DATE)
      WHERE b.activo = true
      GROUP BY b.grado
      ORDER BY total DESC
    `);
    return res.rows.map((r) => ({ grado: r.grado, total: Number(r.total) }));
  } finally {
    client.release();
  }
}

export async function getCapacitaciones(): Promise<CapacitacionRow[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<CapacitacionRow>(`
      SELECT id, empresa, tema, fecha::text, num_participantes, horas
      FROM capacitacion_brindada
      ORDER BY fecha DESC
      LIMIT 20
    `);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function getCapacitacionesPorMes(): Promise<CapacitacionMes[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<{ mes: string; participantes: string }>(`
      SELECT TO_CHAR(DATE_TRUNC('month', fecha), 'Mon') AS mes,
             COALESCE(SUM(num_participantes), 0) AS participantes
      FROM capacitacion_brindada
      WHERE EXTRACT(year FROM fecha) = EXTRACT(year FROM CURRENT_DATE)
      GROUP BY DATE_TRUNC('month', fecha)
      ORDER BY DATE_TRUNC('month', fecha)
    `);
    return res.rows.map((r) => ({ mes: r.mes, participantes: Number(r.participantes) }));
  } finally {
    client.release();
  }
}

export async function getVehiculos(): Promise<VehiculoRow[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<VehiculoRow>(`
      SELECT id, codigo, tipo, estado, motivo, km_actual
      FROM vehiculo
      ORDER BY codigo
    `);
    return res.rows;
  } finally {
    client.release();
  }
}
