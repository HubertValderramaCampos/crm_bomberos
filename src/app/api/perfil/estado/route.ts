import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ perfil_completado: true });

  const { rows } = await pool.query<{
    perfil_completado: boolean;
    grado: string; apellidos: string; nombres: string;
    fecha_nacimiento: string | null; correo: string | null;
    telefono: string | null;
    contacto_emergencia_nombre: string | null;
    contacto_emergencia_telefono: string | null;
  }>(
    `SELECT COALESCE(perfil_completado, false) AS perfil_completado,
            grado, apellidos, nombres,
            fecha_nacimiento::text, correo, telefono,
            contacto_emergencia_nombre, contacto_emergencia_telefono
     FROM bombero WHERE id = $1`,
    [session.user.bomberoId]
  );

  if (!rows[0]) return NextResponse.json({ perfil_completado: true });
  return NextResponse.json(rows[0]);
}
