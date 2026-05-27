/**
 * Fusiona "I.E. I 585" con "IEI N° 585 Bella Aurora":
 * - Reasigna el token de I.E. I 585 a la entidad correcta
 * - Elimina la entidad duplicada
 */
import pg from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 6543,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const client = await pool.connect();
try {
  await client.query("BEGIN");

  // Buscar ambas entidades
  const { rows: entidades } = await client.query(`
    SELECT id, nombre FROM entidad WHERE nombre IN ('IEI N° 585 Bella Aurora', 'I.E. I 585')
  `);
  console.log("Entidades encontradas:", entidades);

  const correcta  = entidades.find(e => e.nombre === "IEI N° 585 Bella Aurora");
  const duplicada = entidades.find(e => e.nombre === "I.E. I 585");

  if (!correcta || !duplicada) {
    throw new Error(`No se encontraron ambas entidades. Encontradas: ${JSON.stringify(entidades)}`);
  }

  console.log(`Entidad correcta: id=${correcta.id}`);
  console.log(`Entidad duplicada: id=${duplicada.id}`);

  // Reasignar el token de la duplicada a la correcta
  const { rowCount: tokensActualizados } = await client.query(
    `UPDATE encuesta_token SET entidad_id = $1 WHERE entidad_id = $2`,
    [correcta.id, duplicada.id]
  );
  console.log(`Tokens reasignados: ${tokensActualizados}`);

  // Eliminar la entidad duplicada
  await client.query(`DELETE FROM entidad WHERE id = $1`, [duplicada.id]);
  console.log(`Entidad duplicada eliminada (id=${duplicada.id})`);

  await client.query("COMMIT");
  console.log("✅ Fusión completada.");
} catch (err) {
  await client.query("ROLLBACK");
  console.error("❌ Error — rollback:", err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
