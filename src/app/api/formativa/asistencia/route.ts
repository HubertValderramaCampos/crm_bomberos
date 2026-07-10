import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// Cía. de Bomberos Voluntarios N.° 150 — Av. José Gálvez Circunvalación 315/320, Puente Piedra 15118
const CUARTEL_LAT = -11.867292;
const CUARTEL_LNG = -77.078888;
const RADIO_METROS = 50;

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Determina si la hora/día actual corresponde a un horario programado, con
// ±2h de flexibilidad. Se evalúa en JS (no en SQL) porque la comparación de
// "hora del día" simple no alcanza: un turno puede cruzar la medianoche
// (ej. 22:00–06:00), o alguien puede llegar/salir del otro lado de la
// medianoche respecto al día programado (ej. 1h30 antes de un turno que
// empieza a las 00:30). Por eso se prueba la ocurrencia de cada horario en
// ayer/hoy/mañana y se compara con marcas de tiempo reales, no solo horas.
async function esDiaProgramado(): Promise<boolean> {
  const { rows } = await pool.query<{ dia_semana: number; hora_inicio: string; hora_fin: string }>(
    `SELECT dia_semana, hora_inicio::text, hora_fin::text FROM formativa_horario WHERE activo = true`
  );

  const ahora = new Date();
  return rows.some(h => {
    const [hI, mI] = h.hora_inicio.split(":").map(Number);
    const [hF, mF] = h.hora_fin.split(":").map(Number);

    for (const offsetDias of [-1, 0, 1]) {
      const base = new Date(ahora);
      base.setDate(base.getDate() + offsetDias);
      if (base.getDay() !== h.dia_semana) continue;

      const inicio = new Date(base);
      inicio.setHours(hI, mI, 0, 0);
      const fin = new Date(base);
      fin.setHours(hF, mF, 0, 0);
      if (fin <= inicio) fin.setDate(fin.getDate() + 1); // turno que cruza medianoche

      const desde = new Date(inicio.getTime() - 2 * 60 * 60 * 1000);
      const hasta = new Date(fin.getTime() + 2 * 60 * 60 * 1000);
      if (ahora >= desde && ahora <= hasta) return true;
    }
    return false;
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT id, fecha::text,
            (hora_entrada AT TIME ZONE 'America/Lima')::text AS hora_entrada,
            (hora_salida  AT TIME ZONE 'America/Lima')::text AS hora_salida,
            tipo, motivo
     FROM asistencia_formativa
     WHERE bombero_id = $1
     ORDER BY fecha DESC, hora_entrada DESC
     LIMIT 30`,
    [session.user.bomberoId]
  );
  return NextResponse.json(rows);
}

// GET de horarios activos (para mostrar al aspirante qué días debe venir)
export async function OPTIONS() {
  const { rows } = await pool.query(
    `SELECT dia_semana, hora_inicio::text, hora_fin::text, descripcion
     FROM formativa_horario WHERE activo = true ORDER BY dia_semana, hora_inicio`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categoria = session.user.categoria ?? "BOMBERO";
  if (!["ASPIRANTE", "POSTULANTE"].includes(categoria))
    return NextResponse.json({ error: "Solo aspirantes y postulantes" }, { status: 403 });

  const { lat, lng, tipo, motivo, fotoUrl } = await req.json() as {
    lat: number; lng: number; tipo: "entrada" | "salida"; motivo?: string; fotoUrl?: string | null;
  };

  const dist = distanciaMetros(lat, lng, CUARTEL_LAT, CUARTEL_LNG);
  if (dist > RADIO_METROS)
    return NextResponse.json({
      error: `Estás a ${Math.round(dist)}m del cuartel. Debes estar a menos de ${RADIO_METROS}m.`,
      dist: Math.round(dist),
    }, { status: 400 });

  const { rows: bRows } = await pool.query(
    `SELECT face_descriptor FROM bombero WHERE id = $1`, [session.user.bomberoId]
  );
  if (!bRows[0]?.face_descriptor)
    return NextResponse.json({ error: "Primero registra tu rostro en Entrenamiento." }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);

  // Determinar si es asistencia regular o extra
  const esProgramado = await esDiaProgramado();
  const tipoAsistencia = esProgramado ? "regular" : "extra";

  // Si es extra y no tiene motivo, requerirlo
  if (tipoAsistencia === "extra" && tipo === "entrada" && !motivo?.trim())
    return NextResponse.json({ requiere_motivo: true, mensaje: "¿A qué viniste hoy? Indica el motivo." }, { status: 200 });

  if (tipo === "entrada") {
    const { rows: exists } = await pool.query(
      `SELECT id FROM asistencia_formativa WHERE bombero_id = $1 AND fecha = $2`,
      [session.user.bomberoId, today]
    );
    if (exists.length > 0)
      return NextResponse.json({ error: "Ya registraste tu entrada hoy." }, { status: 409 });

    await pool.query(
      `INSERT INTO asistencia_formativa (bombero_id, lat, lng, tipo, motivo, foto_entrada_url)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [session.user.bomberoId, lat, lng, tipoAsistencia, motivo ?? null, fotoUrl ?? null]
    );
    return NextResponse.json({ ok: true, tipo: "entrada", tipo_asistencia: tipoAsistencia });
  }

  if (tipo === "salida") {
    const { rows: reg } = await pool.query(
      `SELECT id, hora_salida FROM asistencia_formativa WHERE bombero_id = $1 AND fecha = $2`,
      [session.user.bomberoId, today]
    );
    if (reg.length === 0)
      return NextResponse.json({ error: "Primero debes registrar tu entrada." }, { status: 400 });
    if (reg[0].hora_salida)
      return NextResponse.json({ error: "Ya registraste tu salida hoy." }, { status: 409 });

    await pool.query(
      `UPDATE asistencia_formativa SET hora_salida = NOW(), foto_salida_url = $2 WHERE id = $1`,
      [reg[0].id, fotoUrl ?? null]
    );
    return NextResponse.json({ ok: true, tipo: "salida" });
  }

  return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
}
