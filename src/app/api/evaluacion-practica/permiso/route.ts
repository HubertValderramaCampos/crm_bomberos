import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import { puedeEditarEvaluacionPractica } from "@/lib/evaluacionPracticaAuth";

// GET: indica si el usuario actual puede llenar/editar evaluaciones y si es jefe
// (para mostrar el botón de "gestionar quién puede llenar")
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const puedeEditar = await puedeEditarEvaluacionPractica(session.user.id, session.user.rol);
  return NextResponse.json({ puedeEditar, esJefe: esRolJefe(session.user.rol) });
}
