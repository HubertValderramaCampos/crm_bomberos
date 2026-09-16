import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import { puedeEditarEvaluacionPractica } from "@/lib/evaluacionPracticaAuth";
import { TIPOS_PRACTICA } from "@/lib/evaluacionPracticaCatalogo";
import pool from "@/lib/db";

// GET: detalle completo — visible para todos los usuarios autenticados
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const evalRes = await pool.query(`
    SELECT ep.id, ep.fecha::text, ep.hora, ep.lugar, ep.tipo_practica, ep.comentarios,
           ep.created_at, ep.updated_at,
           u.codigo AS creado_por_codigo, b.apellidos, b.nombres
    FROM evaluacion_practica ep
    JOIN usuario u ON u.id = ep.creado_por
    LEFT JOIN bombero b ON b.id = u.bombero_id
    WHERE ep.id = $1
  `, [id]);

  if (evalRes.rows.length === 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const itemsRes = await pool.query(
    `SELECT id, seccion, orden, descripcion, respuesta
     FROM evaluacion_practica_item
     WHERE evaluacion_id = $1
     ORDER BY id`,
    [id]
  );

  const puedeEditar = await puedeEditarEvaluacionPractica(session.user.id, session.user.rol);

  return NextResponse.json({ evaluacion: evalRes.rows[0], items: itemsRes.rows, puedeEditar });
}

// PATCH: actualizar encabezado / comentarios (solo Operaciones, Jefes o editores autorizados)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const autorizado = await puedeEditarEvaluacionPractica(session.user.id, session.user.rol);
  if (!autorizado) return NextResponse.json({ error: "No tienes permiso para editar esta evaluación" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  if (body.tipoPractica !== undefined && !(TIPOS_PRACTICA as readonly string[]).includes(body.tipoPractica)) {
    return NextResponse.json({ error: "Tipo de práctica inválido" }, { status: 400 });
  }

  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;
  if (body.fecha !== undefined)        { campos.push(`fecha = $${i++}`);         valores.push(body.fecha); }
  if (body.hora !== undefined)         { campos.push(`hora = $${i++}`);          valores.push(body.hora || null); }
  if (body.lugar !== undefined)        { campos.push(`lugar = $${i++}`);         valores.push(body.lugar || null); }
  if (body.tipoPractica !== undefined) { campos.push(`tipo_practica = $${i++}`); valores.push(body.tipoPractica); }
  if (body.comentarios !== undefined)  { campos.push(`comentarios = $${i++}`);   valores.push(body.comentarios || null); }
  if (campos.length === 0) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  campos.push(`updated_at = NOW()`);
  valores.push(id);

  const { rows } = await pool.query(
    `UPDATE evaluacion_practica SET ${campos.join(", ")} WHERE id = $${i} RETURNING id`,
    valores
  );
  if (rows.length === 0) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

// DELETE: solo jefe
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolJefe(session.user.rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { id } = await params;
  await pool.query(`DELETE FROM evaluacion_practica WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
