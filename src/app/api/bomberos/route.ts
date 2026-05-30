import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { rows } = await pool.query<{ id: number; apellidos: string; nombres: string; grado: string; codigo: string }>(
    `SELECT id, apellidos, nombres, grado, codigo FROM bombero WHERE activo = true AND categoria = 'BOMBERO' ORDER BY apellidos`
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.rol !== "JEFE_COMPANIA")
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const { apellidos, nombres, grado, codigo, dni, telefono, categoria, password } = await req.json();

  if (!apellidos || !nombres || !categoria)
    return NextResponse.json({ error: "Apellidos, nombres y categoría son obligatorios" }, { status: 400 });

  if (categoria === "BOMBERO" && !codigo)
    return NextResponse.json({ error: "El código es obligatorio para bomberos" }, { status: 400 });

  if (categoria === "BOMBERO" && !grado)
    return NextResponse.json({ error: "El grado es obligatorio para bomberos" }, { status: 400 });

  if (!password)
    return NextResponse.json({ error: "La contraseña es obligatoria" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Crear registro en bombero
    const { rows: bRows } = await client.query<{ id: number }>(
      `INSERT INTO bombero (apellidos, nombres, grado, codigo, dni, telefono, activo, categoria)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7) RETURNING id`,
      [
        apellidos.trim().toUpperCase(),
        nombres.trim().toUpperCase(),
        grado || null,
        codigo?.trim().toUpperCase() || null,
        dni?.trim() || null,
        telefono?.trim() || null,
        categoria,
      ]
    );
    const bomberoId = bRows[0].id;

    // Generar código de login:
    // BOMBERO   → su código CBP (ej: b150-031)
    // ASPIRANTE → "a" + DNI (ej: a76832463)
    // POSTULANTE → "p" + DNI (ej: p76832463)
    const dniLimpio = dni?.trim() || String(bomberoId);
    const loginCodigo = categoria === "BOMBERO"
      ? codigo!.trim().toLowerCase()
      : categoria === "ASPIRANTE"
        ? `a${dniLimpio}`
        : `p${dniLimpio}`;

    // Verificar que no exista ya ese código de login
    const existe = await client.query(
      `SELECT id FROM usuario WHERE codigo = $1`, [loginCodigo]
    );
    if (existe.rows.length > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: `Ya existe un usuario con código "${loginCodigo}"` }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO usuario (codigo, password_hash, rol, activo, bombero_id)
       VALUES ($1, $2, 'BOMBERO', true, $3)`,
      [loginCodigo, hash, bomberoId]
    );

    await client.query("COMMIT");
    return NextResponse.json({ ok: true, bombero_id: bomberoId, login_codigo: loginCodigo }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[POST /api/bomberos]", err);
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  } finally {
    client.release();
  }
}
