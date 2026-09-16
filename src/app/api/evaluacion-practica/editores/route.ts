import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { esRolJefe } from "@/lib/roles";
import pool from "@/lib/db";

// GET: lista de usuarios autorizados individualmente + roster completo para elegir
// (solo jefe)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolJefe(session.user.rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const [editoresRes, usuariosRes] = await Promise.all([
    pool.query(`
      SELECT e.usuario_id, e.created_at, u.codigo, u.rol, b.apellidos, b.nombres, b.grado
      FROM evaluacion_practica_editor e
      JOIN usuario u ON u.id = e.usuario_id
      LEFT JOIN bombero b ON b.id = u.bombero_id
      ORDER BY b.apellidos NULLS LAST, u.codigo
    `),
    pool.query(`
      SELECT u.id, u.codigo, u.rol, b.apellidos, b.nombres, b.grado
      FROM usuario u
      LEFT JOIN bombero b ON b.id = u.bombero_id
      WHERE u.activo = true
      ORDER BY b.apellidos NULLS LAST, u.codigo
    `),
  ]);

  return NextResponse.json({ editores: editoresRes.rows, usuarios: usuariosRes.rows });
}

// POST: autorizar a un usuario específico (solo jefe)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!esRolJefe(session.user.rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { usuarioId } = await req.json();
  if (!usuarioId) return NextResponse.json({ error: "Falta usuarioId" }, { status: 400 });

  await pool.query(
    `INSERT INTO evaluacion_practica_editor (usuario_id, agregado_por)
     VALUES ($1, $2) ON CONFLICT (usuario_id) DO NOTHING`,
    [Number(usuarioId), Number(session.user.id)]
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
