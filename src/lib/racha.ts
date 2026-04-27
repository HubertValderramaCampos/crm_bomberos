import pool from "./db";

export interface RachaData {
  rachaActual: number;       // semanas consecutivas actuales
  rachaMejor: number;        // mejor racha histórica
  asistioEstaSemana: boolean;
  asistioSemanaAnterior: boolean;
  diasUltimas4Semanas: number; // días asistidos en las últimas 4 semanas
  totalTurnos: number;         // total histórico de turnos
}

export async function calcularRacha(bomberoId: number): Promise<RachaData> {
  // Obtiene todos los días en que el bombero asistió (desde asistencia_turno)
  const res = await pool.query<{ semana: string }>(`
    SELECT DISTINCT
      TO_CHAR(DATE_TRUNC('week', ec.created_at), 'IYYY-IW') AS semana
    FROM asistencia_turno at
    JOIN estado_compania ec ON ec.id = at.estado_compania_id
    WHERE at.bombero_id = $1
    ORDER BY semana DESC
  `, [bomberoId]);

  const semanasSet = new Set(res.rows.map(r => r.semana));
  const totalTurnos = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM asistencia_turno at
     JOIN estado_compania ec ON ec.id = at.estado_compania_id
     WHERE at.bombero_id = $1`, [bomberoId]
  );

  // Semana actual y últimas semanas
  const hoy = new Date();
  function isoWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-${String(week).padStart(2, '0')}`;
  }

  function semanaOffset(offset: number): string {
    const d = new Date(hoy);
    d.setDate(d.getDate() - offset * 7);
    return isoWeek(d);
  }

  const semanaActual   = semanaOffset(0);
  const semanaAnterior = semanaOffset(1);

  const asistioEstaSemana      = semanasSet.has(semanaActual);
  const asistioSemanaAnterior  = semanasSet.has(semanaAnterior);

  // Días asistidos en últimas 4 semanas
  const diasUltimas4 = await pool.query<{ total: string }>(`
    SELECT COUNT(DISTINCT DATE(ec.created_at)) AS total
    FROM asistencia_turno at
    JOIN estado_compania ec ON ec.id = at.estado_compania_id
    WHERE at.bombero_id = $1
      AND ec.created_at >= NOW() - INTERVAL '28 days'
  `, [bomberoId]);

  // Racha actual: contar semanas consecutivas hacia atrás desde la más reciente
  // (si no asistió esta semana, empieza desde la semana anterior)
  let rachaActual = 0;
  const startOffset = asistioEstaSemana ? 0 : 1;
  for (let i = startOffset; i < 104; i++) { // máximo 2 años atrás
    if (semanasSet.has(semanaOffset(i))) {
      rachaActual++;
    } else {
      break;
    }
  }

  // Mejor racha histórica
  const todasSemanas = res.rows.map(r => r.semana).sort();
  let rachaMejor = 0;
  let rachaTemp  = 0;
  let prevSemana = "";

  for (const semana of todasSemanas) {
    if (!prevSemana) {
      rachaTemp = 1;
    } else {
      // Verificar si es semana consecutiva
      const [py, pw] = prevSemana.split('-').map(Number);
      const [cy, cw] = semana.split('-').map(Number);
      const totalPrev = py * 52 + pw;
      const totalCurr = cy * 52 + cw;
      if (totalCurr - totalPrev === 1) {
        rachaTemp++;
      } else {
        rachaTemp = 1;
      }
    }
    if (rachaTemp > rachaMejor) rachaMejor = rachaTemp;
    prevSemana = semana;
  }
  // Incluir racha actual si supera el histórico
  if (rachaActual > rachaMejor) rachaMejor = rachaActual;

  return {
    rachaActual,
    rachaMejor,
    asistioEstaSemana,
    asistioSemanaAnterior,
    diasUltimas4Semanas: Number(diasUltimas4.rows[0]?.total ?? 0),
    totalTurnos: Number(totalTurnos.rows[0]?.total ?? 0),
  };
}
