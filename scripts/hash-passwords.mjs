// Ejecutar con: node scripts/hash-passwords.mjs
// Hashea las contraseñas que aún son texto plano (código en mayúsculas, ej: A26134)
// La contraseña por defecto es el código en minúsculas (ej: a26134)

import bcrypt from "bcryptjs";
import pg from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Selecciona usuarios cuyo password_hash NO empieza con $2b$ (es decir, no está hasheado aún)
const { rows } = await pool.query(`
  SELECT id, codigo, password_hash
  FROM usuario
  WHERE password_hash NOT LIKE '$2b$%'
    AND password_hash NOT LIKE '$2a$%'
`);

console.log(`Usuarios a procesar: ${rows.length}`);

for (const row of rows) {
  // La contraseña en texto plano es el valor actual (mayúsculas) o el código en minúsculas
  const plaintext = row.password_hash ?? row.codigo;
  const hash = await bcrypt.hash(plaintext.toLowerCase(), 10);
  await pool.query("UPDATE usuario SET password_hash = $1 WHERE id = $2", [hash, row.id]);
  console.log(`  ✓ ${row.codigo}  →  contraseña: ${plaintext.toLowerCase()}`);
}

console.log("\nListo. Todos los usuarios pueden ingresar con su código en minúsculas como contraseña.");
await pool.end();
