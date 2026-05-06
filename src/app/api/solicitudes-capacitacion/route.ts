import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { obtenerUrlFirmada } from "@/lib/storage";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const esAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"].includes(session.user.rol);

  const { rows } = await pool.query(`
    SELECT s.*, e.nombre AS entidad_nombre
    FROM solicitud_capacitacion s
    LEFT JOIN entidad e ON e.id = s.entidad_id
    ${!esAdmin ? "WHERE s.subido_por_nombre = $1" : ""}
    ORDER BY s.creado_en DESC
  `, !esAdmin ? [session.user.nombres ?? ""] : []);

  // Generar URLs firmadas para las imágenes
  const resultado = await Promise.all(
    rows.map(async row => {
      if (row.imagen_key) {
        try {
          row.imagen_url = await obtenerUrlFirmada(row.imagen_key, 3600);
        } catch {
          row.imagen_url = null;
        }
      }
      return row;
    })
  );

  return NextResponse.json(resultado);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const {
    empresa, contacto, telefono, correo, tema, descripcion,
    fecha_solicitada, hora_inicio, hora_fin, lugar,
    num_participantes, notas, entidad_id, imagen_key, tipo_documento, subtipo_oficio,
  } = body;

  const { rows } = await pool.query<{ id: number }>(`
    INSERT INTO solicitud_capacitacion
      (empresa, contacto, telefono, correo, tema, descripcion,
       fecha_solicitada, hora_inicio, hora_fin, lugar,
       num_participantes, notas, entidad_id, estado,
       subido_por_rol, subido_por_nombre, imagen_key, tipo_documento, subtipo_oficio)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'PENDIENTE',$14,$15,$16,$17,$18)
    RETURNING id
  `, [
    empresa ?? null, contacto ?? null, telefono ?? null, correo ?? null,
    tema ?? null, descripcion ?? null,
    fecha_solicitada ?? null, hora_inicio ?? null, hora_fin ?? null,
    lugar ?? null, num_participantes ?? null, notas ?? null,
    entidad_id ?? null,
    session.user.rol,
    session.user.nombres ?? null,
    imagen_key ?? null,
    tipo_documento ?? "otro",
    subtipo_oficio ?? null,
  ]);

  return NextResponse.json({ id: rows[0].id }, { status: 201 });
}
