import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

const CUARTEL_LAT = -11.828583;  // 11°49'42.9"S = -(11 + 49/60 + 42.9/3600)
const CUARTEL_LNG = -77.102278;  // 77°06'08.2"W = -(77 + 6/60 + 8.2/3600)
const RADIO_METROS = 50;         // margen ampliado para imprecisión de GPS en iPhone

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET: historial de asistencia del bombero actual
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT id, fecha::text, hora_entrada::text, lat, lng
     FROM asistencia_formativa
     WHERE bombero_id = $1
     ORDER BY fecha DESC, hora_entrada DESC
     LIMIT 30`,
    [session.user.bomberoId]
  );
  return NextResponse.json(rows);
}

// POST: marcar asistencia
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categoria = session.user.categoria ?? "BOMBERO";
  if (!["ASPIRANTE", "POSTULANTE"].includes(categoria))
    return NextResponse.json({ error: "Solo aspirantes y postulantes" }, { status: 403 });

  const { lat, lng } = await req.json() as { lat: number; lng: number };

  // Verificar ubicación
  const dist = distanciaMetros(lat, lng, CUARTEL_LAT, CUARTEL_LNG);
  if (dist > RADIO_METROS)
    return NextResponse.json({ error: `Estás a ${Math.round(dist)}m del cuartel. Debes estar a menos de ${RADIO_METROS}m.`, dist: Math.round(dist) }, { status: 400 });

  // Verificar que tenga rostro registrado
  const { rows } = await pool.query(
    `SELECT face_descriptor FROM bombero WHERE id = $1`,
    [session.user.bomberoId]
  );
  if (!rows[0]?.face_descriptor)
    return NextResponse.json({ error: "Primero debes registrar tu rostro en Entrenamiento." }, { status: 400 });

  // Insertar asistencia (UNIQUE por bombero+fecha evita duplicados)
  try {
    await pool.query(
      `INSERT INTO asistencia_formativa (bombero_id, lat, lng) VALUES ($1, $2, $3)`,
      [session.user.bomberoId, lat, lng]
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505")
      return NextResponse.json({ error: "Ya registraste tu asistencia hoy." }, { status: 409 });
    throw err;
  }
}
