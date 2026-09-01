// node scripts/seed-checklist-items.mjs [--apply]
//
// Lee los 3 "Check List ... .xlsx" de la raíz del repo (formato de inspección de
// equipo por unidad) y arma el catálogo de checklist_item por vehículo.
//
// Sin --apply solo escribe un JSON de revisión en scratchpad y no toca la base.
// Con --apply, borra e inserta (por vehiculo_id) en checklist_item.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ debug: false });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const APPLY = process.argv.includes("--apply");

const FILES = [
  { file: "Check List AMB-150 2026.xlsx", codigo: "AMB-150", maxItem: 150 },
  { file: "Check List MAQ-150-01 2026  1.xlsx", codigo: "M150-1", maxItem: 113 },
  { file: "Check List MAQ-150-03 2026.xlsx", codigo: "M150-3", maxItem: 44 },
];

// Etiquetas que NO son encabezados de sección aunque aparezcan "solas" en su columna
const SKIP_LABELS = new Set([
  "ARTICULO",
  "ITEM",
  "EFECTIVO  EJECUTOR",
  "EFECTIVO AL MANDO",
  "FECHA",
  "OBSERVACIONES:",
  "EFECTIVO EAL MANDO (NOMBRE Y FIRMA)",
  "EFECTIVO EJECUTOR (NOMBRE Y FIRMA)",
]);

function decodeXmlEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

function extractXlsx(xlsxPath) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-xlsx-"));
  const zipPath = path.join(tmpDir, "src.zip");
  fs.copyFileSync(xlsxPath, zipPath);
  execFileSync("powershell.exe", [
    "-NoProfile", "-Command",
    `Expand-Archive -Path '${zipPath}' -DestinationPath '${tmpDir}' -Force`,
  ]);
  return tmpDir;
}

function parseSharedStrings(dir) {
  const p = path.join(dir, "xl", "sharedStrings.xml");
  if (!fs.existsSync(p)) return [];
  const xml = fs.readFileSync(p, "utf8");
  const items = [];
  const siRegex = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRegex.exec(xml))) {
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let text = "";
    let tm;
    while ((tm = tRegex.exec(m[1]))) text += decodeXmlEntities(tm[1]);
    items.push(text);
  }
  return items;
}

function parseSheetRows(dir, sharedStrings) {
  const p = path.join(dir, "xl", "worksheets", "sheet1.xml");
  const xml = fs.readFileSync(p, "utf8");
  const rows = [];
  const rowRegex = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRegex.exec(xml))) {
    const rowNum = Number(rm[1]);
    const cellRegex = /<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    const data = {};
    let cm;
    while ((cm = cellRegex.exec(rm[2]))) {
      const attrs = cm[1];
      const rMatch = /r="([A-Z]+)\d+"/.exec(attrs);
      if (!rMatch) continue;
      const col = rMatch[1];
      const tMatch = /\st="([^"]*)"/.exec(attrs);
      const type = tMatch ? tMatch[1] : undefined;
      const inner = cm[2] || "";
      let value = "";
      if (type === "s") {
        const vMatch = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (vMatch) value = sharedStrings[Number(vMatch[1])] ?? "";
      } else if (type === "inlineStr") {
        const tMatch2 = /<t[^>]*>([\s\S]*?)<\/t>/.exec(inner);
        if (tMatch2) value = decodeXmlEntities(tMatch2[1]);
      } else {
        const vMatch = /<v>([\s\S]*?)<\/v>/.exec(inner);
        if (vMatch) value = decodeXmlEntities(vMatch[1]);
      }
      if (value !== "") data[col] = value;
    }
    if (Object.keys(data).length > 0) rows.push({ row: rowNum, data });
  }
  return rows;
}

function isInt(s) {
  return typeof s === "string" && /^\d+$/.test(s);
}

function extractItems(rows) {
  let leftSection = null;
  let rightSection = null;
  const items = [];

  for (const { data } of rows) {
    if (data.C === "OBSERVACIONES:") break; // fin de la tabla, empieza el pie del formato

    // Encabezado de sección izquierda: solo C, sin B ni D en la misma fila
    if (data.C && data.B === undefined && data.D === undefined && !SKIP_LABELS.has(data.C)) {
      leftSection = data.C.trim();
      if (rightSection === null) rightSection = leftSection;
    }
    // Encabezado de sección derecha: solo J, sin I ni K en la misma fila
    if (data.J && data.I === undefined && data.K === undefined && !SKIP_LABELS.has(data.J)) {
      rightSection = data.J.trim();
    }

    // Ítem del bloque izquierdo
    if (isInt(data.B) && data.C && !SKIP_LABELS.has(data.C)) {
      items.push({
        orden: Number(data.B),
        seccion: leftSection ?? "GENERAL",
        articulo: data.C.trim(),
        cantidad: isInt(data.D) ? Number(data.D) : null,
      });
    }
    // Ítem del bloque derecho
    if (isInt(data.I) && data.J && !SKIP_LABELS.has(data.J)) {
      items.push({
        orden: Number(data.I),
        seccion: rightSection ?? "GENERAL",
        articulo: data.J.trim(),
        cantidad: isInt(data.K) ? Number(data.K) : null,
      });
    }
  }

  items.sort((a, b) => a.orden - b.orden);
  return items;
}

function assertIntegro(items, maxItem, codigo) {
  if (items.length !== maxItem) {
    throw new Error(`${codigo}: se esperaban ${maxItem} ítems, se extrajeron ${items.length}`);
  }
  const ordenes = items.map(i => i.orden);
  const esperado = Array.from({ length: maxItem }, (_, i) => i + 1);
  const faltantes = esperado.filter(n => !ordenes.includes(n));
  const duplicados = ordenes.filter((n, i) => ordenes.indexOf(n) !== i);
  if (faltantes.length > 0) throw new Error(`${codigo}: faltan ítems ${faltantes.join(",")}`);
  if (duplicados.length > 0) throw new Error(`${codigo}: ítems duplicados ${duplicados.join(",")}`);
}

async function main() {
  const scratchDir = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-review-"));

  const resultado = {};
  for (const { file, codigo, maxItem } of FILES) {
    const xlsxPath = path.join(REPO_ROOT, file);
    if (!fs.existsSync(xlsxPath)) throw new Error(`No se encontró ${xlsxPath}`);

    const dir = extractXlsx(xlsxPath);
    const sharedStrings = parseSharedStrings(dir);
    const rows = parseSheetRows(dir, sharedStrings);
    const items = extractItems(rows);
    assertIntegro(items, maxItem, codigo);
    fs.rmSync(dir, { recursive: true, force: true });

    resultado[codigo] = items;
    console.log(`${codigo}: OK, ${items.length} ítems, ${new Set(items.map(i => i.seccion)).size} secciones`);
  }

  const reviewPath = path.join(scratchDir, "checklist-items-review.json");
  fs.writeFileSync(reviewPath, JSON.stringify(resultado, null, 2), "utf8");
  console.log(`\nJSON de revisión escrito en: ${reviewPath}`);

  if (!APPLY) {
    console.log("\n(no se aplicó nada — corré con --apply para insertar en la base)");
    return;
  }

  const pool = new Pool({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 6543,
    database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, max: 2,
  });
  const client = await pool.connect();
  try {
    for (const { codigo } of FILES) {
      const items = resultado[codigo];
      const vRes = await client.query(`SELECT id FROM vehiculo WHERE codigo = $1`, [codigo]);
      if (vRes.rows.length === 0) throw new Error(`No existe vehiculo con codigo ${codigo}`);
      const vehiculoId = vRes.rows[0].id;

      await client.query("BEGIN");
      await client.query(`DELETE FROM checklist_item WHERE vehiculo_id = $1`, [vehiculoId]);
      for (const it of items) {
        await client.query(
          `INSERT INTO checklist_item (vehiculo_id, seccion, orden, articulo, cantidad) VALUES ($1,$2,$3,$4,$5)`,
          [vehiculoId, it.seccion, it.orden, it.articulo, it.cantidad]
        );
      }
      await client.query("COMMIT");
      console.log(`${codigo}: insertados ${items.length} ítems (vehiculo_id=${vehiculoId})`);
    }
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
