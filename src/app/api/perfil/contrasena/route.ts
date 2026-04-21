import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { actual?: string; nueva?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { actual, nueva } = body;

  if (!actual || !nueva) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  if (nueva.length < 8) {
    return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ password_hash: string }>(
      "SELECT password_hash FROM usuario WHERE id = $1",
      [session.user.id]
    );

    const user = rows[0];
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const match = await bcrypt.compare(actual, user.password_hash);
    if (!match) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });

    const hash = await bcrypt.hash(nueva, 12);
    await client.query("UPDATE usuario SET password_hash = $1 WHERE id = $2", [hash, session.user.id]);

    return NextResponse.json({ ok: true });
  } finally {
    client.release();
  }
}
