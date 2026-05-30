import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: obtener descriptor facial del bombero actual
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query(
    `SELECT face_descriptor FROM bombero WHERE id = $1`,
    [session.user.bomberoId]
  );
  const descriptor = rows[0]?.face_descriptor ?? null;
  return NextResponse.json({ descriptor });
}

// POST: guardar descriptor facial
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.bomberoId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const categoria = session.user.categoria ?? "BOMBERO";
  if (!["ASPIRANTE", "POSTULANTE"].includes(categoria))
    return NextResponse.json({ error: "Solo aspirantes y postulantes" }, { status: 403 });

  const { descriptor } = await req.json() as { descriptor: number[] };
  if (!Array.isArray(descriptor) || descriptor.length !== 128)
    return NextResponse.json({ error: "Descriptor inválido" }, { status: 400 });

  await pool.query(
    `UPDATE bombero SET face_descriptor = $1 WHERE id = $2`,
    [descriptor, session.user.bomberoId]
  );

  return NextResponse.json({ ok: true });
}
