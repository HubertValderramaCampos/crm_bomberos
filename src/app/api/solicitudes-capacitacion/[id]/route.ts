import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const {
    estado, actividad_id, entidad_id,
    empresa, contacto, telefono, correo, tema, descripcion,
    fecha_solicitada, hora_inicio, hora_fin, lugar, num_participantes, notas,
  } = body;

  await pool.query(
    `UPDATE solicitud_capacitacion SET
      estado            = COALESCE($1,  estado),
      actividad_id      = COALESCE($2,  actividad_id),
      entidad_id        = COALESCE($3,  entidad_id),
      empresa           = COALESCE($4,  empresa),
      contacto          = COALESCE($5,  contacto),
      telefono          = COALESCE($6,  telefono),
      correo            = COALESCE($7,  correo),
      tema              = COALESCE($8,  tema),
      descripcion       = COALESCE($9,  descripcion),
      fecha_solicitada  = COALESCE($10, fecha_solicitada),
      hora_inicio       = COALESCE($11, hora_inicio),
      hora_fin          = COALESCE($12, hora_fin),
      lugar             = COALESCE($13, lugar),
      num_participantes = COALESCE($14, num_participantes),
      notas             = COALESCE($15, notas)
    WHERE id = $16`,
    [
      estado ?? null, actividad_id ?? null, entidad_id ?? null,
      empresa ?? null, contacto ?? null, telefono ?? null, correo ?? null,
      tema ?? null, descripcion ?? null,
      fecha_solicitada ?? null, hora_inicio ?? null, hora_fin ?? null,
      lugar ?? null, num_participantes ?? null, notas ?? null,
      id,
    ]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await pool.query(`DELETE FROM solicitud_capacitacion WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
