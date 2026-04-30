import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query<{
    id: number; nombre: string; tipo: string; contacto: string | null;
    telefono: string | null; correo: string | null; direccion: string | null; notas: string | null;
    total_actividades: number; total_oficios: number; total_donaciones: number;
  }>(`
    SELECT e.id, e.nombre, e.tipo, e.contacto, e.telefono, e.correo, e.direccion, e.notas,
      (SELECT COUNT(*) FROM programacion_actividad WHERE entidad_id = e.id)::int AS total_actividades,
      (SELECT COUNT(*) FROM oficio_institucional    WHERE entidad_id = e.id)::int +
      (SELECT COUNT(*) FROM oficio_varios           WHERE entidad_id = e.id)::int AS total_oficios,
      (SELECT COUNT(*) FROM donacion                WHERE entidad_id = e.id)::int AS total_donaciones
    FROM entidad e
    ORDER BY e.nombre
  `);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { nombre, tipo, contacto, telefono, correo, direccion, notas } = await req.json();
  if (!nombre) return NextResponse.json({ error: "Nombre obligatorio" }, { status: 400 });

  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO entidad (nombre, tipo, contacto, telefono, correo, direccion, notas)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [nombre, tipo ?? "EMPRESA", contacto ?? null, telefono ?? null, correo ?? null, direccion ?? null, notas ?? null]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
