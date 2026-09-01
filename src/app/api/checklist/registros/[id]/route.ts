import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import { obtenerUrlFirmada } from "@/lib/storage";
import pool from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const regRes = await pool.query(`
    SELECT
      r.id, r.vehiculo_id, r.fecha, r.estado, r.observaciones, r.efectivo_al_mando,
      r.created_at, r.updated_at, r.completado_en,
      v.codigo AS vehiculo_codigo, v.tipo AS vehiculo_tipo,
      b.id AS bombero_id, b.codigo AS bombero_codigo, b.grado, b.apellidos, b.nombres
    FROM checklist_registro r
    JOIN vehiculo v ON v.id = r.vehiculo_id
    JOIN bombero b ON b.id = r.bombero_id
    WHERE r.id = $1
  `, [id]);

  if (regRes.rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const registro = regRes.rows[0];

  const itemsRes = await pool.query<{ foto_key: string | null; [k: string]: unknown }>(`
    SELECT ri.id, ri.estado, ri.observacion, ri.foto_key,
           ci.id AS item_id, ci.seccion, ci.orden, ci.articulo, ci.cantidad
    FROM checklist_registro_item ri
    JOIN checklist_item ci ON ci.id = ri.item_id
    WHERE ri.registro_id = $1
    ORDER BY ci.orden
  `, [id]);

  const items = await Promise.all(itemsRes.rows.map(async row => ({
    ...row,
    foto_url: row.foto_key ? await obtenerUrlFirmada(row.foto_key, 3600).catch(() => null) : null,
  })));

  const puedeEditar = registro.estado === "EN_PROGRESO" &&
    (session.user.bomberoId === registro.bombero_id || esRolJefe(session.user.rol));

  return NextResponse.json({ registro, items, puedeEditar });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const actualRes = await pool.query<{ bombero_id: number; estado: string }>(
    `SELECT bombero_id, estado FROM checklist_registro WHERE id = $1`, [id]
  );
  if (actualRes.rows.length === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  const actual = actualRes.rows[0];

  const esDueno = session.user.bomberoId === actual.bombero_id;
  if (!esDueno && !esRolJefe(session.user.rol)) {
    return NextResponse.json({ error: "No puedes editar este checklist" }, { status: 403 });
  }
  if (actual.estado !== "EN_PROGRESO") {
    return NextResponse.json({ error: "Este checklist ya está completado" }, { status: 400 });
  }

  const campos: string[] = [];
  const valores: unknown[] = [];
  let i = 1;

  if (body.observaciones !== undefined)     { campos.push(`observaciones = $${i++}`);     valores.push(body.observaciones || null); }
  if (body.efectivoAlMando !== undefined)   { campos.push(`efectivo_al_mando = $${i++}`); valores.push(body.efectivoAlMando || null); }
  if (body.completar === true) {
    campos.push(`estado = 'COMPLETADO'`, `completado_en = NOW()`);
  }
  campos.push(`updated_at = NOW()`);

  if (campos.length === 1) return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });

  valores.push(id);
  const { rows } = await pool.query(
    `UPDATE checklist_registro SET ${campos.join(", ")} WHERE id = $${i} RETURNING id, estado`,
    valores
  );

  return NextResponse.json(rows[0]);
}
