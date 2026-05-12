import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { calcularRacha } from "@/lib/racha";

// Devuelve si el bombero actual tiene racha >= 4 semanas (acceso a Donaciones y Programación)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ acceso: false });

  const bomberoId = session.user.bomberoId;
  if (!bomberoId) return NextResponse.json({ acceso: false });

  const racha = await calcularRacha(bomberoId);
  return NextResponse.json({ acceso: racha.rachaActual >= 4, rachaActual: racha.rachaActual });
}
