import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import pool from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolJefe(session.user.rol)) {
    return NextResponse.json({ error: "No tienes permiso para editar el catálogo" }, { status: 403 });
  }

  const { itemId } = await params;
  const body = await req.json();

  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (body.seccion !== undefined)  { campos.push(`seccion = $${i++}`);  valores.push(body.seccion); }
  if (body.articulo !== undefined) { campos.push(`articulo = $${i++}`); valores.push(body.articulo); }
  if (body.cantidad !== undefined) { campos.push(`cantidad = $${i++}`); valores.push(body.cantidad === "" ? null : Number(body.cantidad)); }
  if (body.orden !== undefined)    { campos.push(`orden = $${i++}`);    valores.push(Number(body.orden)); }
  if (body.activo !== undefined)   { campos.push(`activo = $${i++}`);   valores.push(!!body.activo); }

  if (campos.length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  valores.push(itemId);
  const { rows } = await pool.query(
    `UPDATE checklist_item SET ${campos.join(", ")} WHERE id = $${i} RETURNING id`,
    valores
  );

  if (rows.length === 0) return NextResponse.json({ error: "Ítem no encontrado" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
