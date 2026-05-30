import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const CUARTEL_LAT = -11.828583;
const CUARTEL_LNG = -77.102278;
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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT id, fecha::text, hora_entrada::text, hora_salida::text, lat, lng
     FROM asistencia_formativa
     WHERE bombero_id = $1
     ORDER BY fecha DESC, hora_entrada DESC
     LIMIT 30`,
    [session.user.bomberoId]
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categoria = session.user.categoria ?? "BOMBERO";
  if (!["ASPIRANTE", "POSTULANTE"].includes(categoria))
    return NextResponse.json({ error: "Solo aspirantes y postulantes" }, { status: 403 });

  const { lat, lng, tipo } = await req.json() as { lat: number; lng: number; tipo: "entrada" | "salida" };

  const dist = distanciaMetros(lat, lng, CUARTEL_LAT, CUARTEL_LNG);
  if (dist > RADIO_METROS)
    return NextResponse.json({
      error: `Estás a ${Math.round(dist)}m del cuartel. Debes estar a menos de ${RADIO_METROS}m.`,
      dist: Math.round(dist),
    }, { status: 400 });

  const { rows: bRows } = await pool.query(
    `SELECT face_descriptor FROM bombero WHERE id = $1`,
    [session.user.bomberoId]
  );
  if (!bRows[0]?.face_descriptor)
    return NextResponse.json({ error: "Primero registra tu rostro en Entrenamiento." }, { status: 400 });

  const today = new Date().toISOString().slice(0, 10);

  if (tipo === "entrada") {
    // Insertar entrada — si ya existe actualiza nada (solo la primera entrada del día)
    const { rows: exists } = await pool.query(
      `SELECT id FROM asistencia_formativa WHERE bombero_id = $1 AND fecha = $2`,
      [session.user.bomberoId, today]
    );
    if (exists.length > 0)
      return NextResponse.json({ error: "Ya registraste tu entrada hoy." }, { status: 409 });

    await pool.query(
      `INSERT INTO asistencia_formativa (bombero_id, lat, lng) VALUES ($1, $2, $3)`,
      [session.user.bomberoId, lat, lng]
    );
    return NextResponse.json({ ok: true, tipo: "entrada" });
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
      `UPDATE asistencia_formativa SET hora_salida = NOW() WHERE id = $1`,
      [reg[0].id]
    );
    return NextResponse.json({ ok: true, tipo: "salida" });
  }

  return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
}
