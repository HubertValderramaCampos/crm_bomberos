import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { subirImagen } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { imagen } = await req.json();
  if (!imagen) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

  const ts  = Date.now();
  const key = `solicitudes/${ts}_${session.user.id ?? "u"}.jpg`;

  try {
    const url = await subirImagen(imagen, key);
    return NextResponse.json({ key, url });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al subir imagen";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
