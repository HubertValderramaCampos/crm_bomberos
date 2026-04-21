import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: {
    fecha_nacimiento?: string;
    correo?: string;
    telefono?: string;
    contacto_emergencia_nombre?: string;
    contacto_emergencia_telefono?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { fecha_nacimiento, correo, telefono, contacto_emergencia_nombre, contacto_emergencia_telefono } = body;

  // Validar correo básico si viene
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return NextResponse.json({ error: "Correo inválido" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE bombero SET
        fecha_nacimiento             = COALESCE($1::date, fecha_nacimiento),
        correo                       = COALESCE($2, correo),
        telefono                     = COALESCE($3, telefono),
        contacto_emergencia_nombre   = COALESCE($4, contacto_emergencia_nombre),
        contacto_emergencia_telefono = COALESCE($5, contacto_emergencia_telefono)
      WHERE id = $6
    `, [
      fecha_nacimiento || null,
      correo || null,
      telefono || null,
      contacto_emergencia_nombre || null,
      contacto_emergencia_telefono || null,
      session.user.bomberoId,
    ]);

    return NextResponse.json({ ok: true });
  } finally {
    client.release();
  }
}
