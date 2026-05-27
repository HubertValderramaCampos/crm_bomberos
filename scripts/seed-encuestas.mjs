/**
 * Seed script: importa las respuestas del Excel de encuestas a la BD.
 * Crea las entidades si no existen, crea un token por entidad,
 * e inserta todas las respuestas.
 *
 * Uso: node scripts/seed-encuestas.mjs
 */

import pg from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });
dotenv.config({ path: join(__dirname, "../.env.local") });

const pool = new pg.Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 6543,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

/* ─── helpers ─────────────────────────────────────────── */

/** Convierte número de serie Excel a fecha ISO YYYY-MM-DD */
function excelDateToISO(serial) {
  if (!serial) return null;
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return d.toISOString().slice(0, 10);
}

/** Convierte fracción decimal del día a HH:MM */
function excelTimeToHHMM(frac) {
  if (frac == null) return null;
  const totalMinutes = Math.round(frac * 24 * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function slugNombre(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20);
}

function siNo(v) {
  if (v == null) return null;
  return v.toString().trim().toLowerCase() === "sí" || v.toString().trim().toLowerCase() === "si";
}

/** Normaliza el nombre de empresa para agrupar variantes del mismo colegio */
function normalizarEmpresa(nombre) {
  if (!nombre) return "Sin nombre";
  const n = nombre.trim();

  // Variantes de IEI 585 Bella Aurora
  if (/bella aurora/i.test(n) || /iei\s*(n[°o]?\s*)?585/i.test(n) || n === "IEI 585") {
    return "IEI N° 585 Bella Aurora";
  }
  // Variantes de Bomberos Puente Piedra (propios)
  if (/bomberos.*puente piedra/i.test(n) || /compañia.*bomberos.*puente piedra/i.test(n) || /cia.*bomberos.*puente piedra/i.test(n)) {
    return "Compañía de Bomberos de Puente Piedra";
  }
  // Nombres de personas individuales (probablemente de Bella Aurora también)
  if (/magaly coral/i.test(n) || /imelda walmery/i.test(n)) {
    return "IEI N° 585 Bella Aurora";
  }

  return n.replace(/\s+/g, " ").trim();
}

/** Clasifica el tipo de entidad según el nombre */
function tipoEntidad(nombre) {
  if (/universidad/i.test(nombre)) return "INSTITUCIÓN PÚBLICA";
  if (/iei|iep|colegio|escuela|i\.e\.|institución educativa|scout/i.test(nombre)) return "INSTITUCIÓN PÚBLICA";
  if (/bomberos/i.test(nombre)) return "INSTITUCIÓN PÚBLICA";
  if (/municipalidad/i.test(nombre)) return "MUNICIPALIDAD";
  if (/hospital|clínica|clinica/i.test(nombre)) return "HOSPITAL";
  if (/ong/i.test(nombre)) return "ONG";
  return "EMPRESA";
}

/* ─── datos crudos del Excel ──────────────────────────── */

const RAW_ROWS = [
  [46147.55339318287,"IEP NUEVO HORIZONTE",0.45833333333575865,46147,"Sí","Sí","Sí","Mejor material de prácticas.","Excelente","Bueno","Excelente","Excelente","Sí","RECIBIMOS CAPACITACIÓN SOBRE USO DE EXTINTORES Y PRIMEROS AUXILIOS EN CASO DE EMERGENCIA A PERSONAL DOCENTE Y ADMINISTRATIVO, EL CUAL FUE MUY PRACTICO, EL EXPOSITOR TENIA MUCHA EXPERIENCIA Y DOMINIO DEL TEMA, FUE MUY  DIDÁCTICO Y DE GRAN APRENDIZAJE"],
  [46149.46206173611,"Metal Raid Perú SAC",0.375,46144,"Sí","Sí","Sí","Mejor material de prácticas.","Excelente","Excelente","Excelente","Excelente","Sí","Fue dinámica, participativa, y de reflexión"],
  [46157.47660556713,"Universidad Autónoma del Perú",0.5833333333357587,46155,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Excelente","Excelente","Excelente","Excelente","Sí","Muy buen servicio, y excelente capacitadores."],
  [46157.505621793985,"Scout puente piedra 424",0.6666666666642413,46144,"Sí","Sí","Sí","Mejor material audiovisual.","Excelente","Excelente","Excelente","Excelente","Sí","La capacitación de primeros auxilios ofrecida por los bomberos fue muy dinámica, útil e interesante para los chicos, ya que les permitió aprender conocimientos importantes que pueden aplicar en situaciones de emergencia. Consideramos que fue una experiencia muy enriquecedora y valiosa para todos los participantes."],
  [46160.3558940625,"CORPESA",0.33333333333575865,46158,"Sí","No","Sí","Mejorar la interacción del Instructor.","Bueno","Bueno","Bueno","Bueno","Sí","Enfocar más en práctica, fue mucha teoría. De igual forma agradecido por su apoyo"],
  [46160.69365601851,"IEI N 585 BELLA AURORA",0.33333333333575865,46160,"Sí","Sí","Sí","Mayor dinámica de grupo.","Bueno","Bueno","Bueno","Excelente","Sí","Ninguna"],
  [46160.69613960648,"I. E. I Bella Aurora",0.33333333333575865,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Excelente","Excelente","Bueno","Excelente","Sí","Fue excelente porque el expositor se dejó comprender  y dinámico"],
  [46160.69828950231,"i. E. I. Bella Aurora",0.33333333333575865,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Excelente","Excelente","Excelente","Excelente","Sí","Muy buena la capacitación"],
  [46160.69852337963,"I E I 585 Bella Aurora",0.3819444444452529,46160,"Sí","Sí","Sí","Mayor dinámica de grupo.","Excelente","Excelente","Excelente","Excelente","Sí","Gracias por brindarnos nuevos conocimientos"],
  [46160.69926559028,"IEI 585 BELLA AURORA",0.33333333333575865,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Excelente","Bueno","Bueno","Bueno","Sí","La capacitación fue entendible y muy dinámica."],
  [46160.712063032406,"IEI 586 BELLA AURORA",0.3819444444452529,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Excelente","Excelente","Excelente","Excelente","Sí","Para primeros auxilios basarse en niños de 3 a 5 años"],
  [46160.71651211806,"COMPAÑIA DE BOMBEROS DE PUENTE PIEDRA",0.33333333333575865,46160,"Sí","Sí","Sí","Mayor dinámica de grupo.","Excelente","Bueno","Excelente","Excelente","Sí","La capacitación sobre el uso de extintores fue clara, práctica y muy útil. El instructor explicó paso a paso el tipo de fuego y cómo usar cada extintor, y la parte práctica nos dio seguridad para actuar en caso de emergencia."],
  [46160.73596173611,"Bomberos de puente piedra",0.36111111110949423,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Excelente","Bueno","Excelente","Bueno","Sí",null],
  [46160.73754898148,"585 Bella Aurora",0.34027777778101154,46160,"Sí","Sí","Sí","Mejor material de prácticas.","Bueno","Bueno","Bueno","Bueno","Sí","Pediría que nos capaciten sobre primeros auxilios"],
  [46160.73893303241,"Bomberos de puente piedra",0.36111111110949423,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Bueno","Excelente","Bueno","Excelente","Sí",null],
  [46160.74863486111,"IEI N°585 Bella Aurora",0.375,46160,"Sí","Sí","Sí","Mayor dinámica de grupo.","Bueno","Bueno","Bueno","Excelente","Sí","Muy bueno"],
  [46160.78158625,"MAGALY Coral Moreno",0.34027777778101154,46160,"Sí","Sí","Sí","Mejor material audiovisual.","Excelente","Excelente","Excelente","Excelente","Sí","Qué sigan las  capacitación a la I E  para tener una adecuada educacion y cultura de prevención ante situaciones de emergencia."],
  [46160.80615693287,"IEI 585 Bella Aurora",0.33333333333575865,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Bueno","Bueno","Bueno","Bueno","Sí","Buena capacitación, muy bien explicado"],
  [46160.81451439815,"IEI 585 bella aurora",0.35416666666424135,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Bueno","Excelente","Bueno","Regular","Sí","Esta muy bueno la capacitación"],
  [46160.82086640046,"IEI 585 Bella Aurora",0.33333333333575865,46160,"Sí","Sí","Sí","Mejor material audiovisual.","Excelente","Excelente","Excelente","Excelente","Sí","Excelente exposición"],
  [46160.83506024306,"IEI 585",0.33333333333575865,46160,"Sí","Sí","Sí","Mejor material audiovisual.","Excelente","Bueno","Excelente","Excelente","Sí",null],
  [46160.8575881713,"Imelda Walmery Mosqueda Gonzáles",0.33333333333575865,46160,"Sí","Sí","Sí","Aumentar los tiempos de Capacitación.","Bueno","Bueno","Bueno","Excelente","Sí","Muy interesante"],
  [46160.859015775466,"I.E. I 585",0.375,46160,"Sí","Sí","Sí","Mejor material audiovisual.","Bueno","Bueno","Bueno","Bueno","Sí",null],
];

/* ─── mapeo de aspectos ───────────────────────────────── */
function parseAspectos(texto) {
  if (!texto) return null;
  const t = texto.toString().trim();
  // Mapear a los valores canónicos que usa el formulario
  const mapa = {
    "mejor material de prácticas": "Mejor material de prácticas",
    "mejor material audiovisual":  "Mejor material audiovisual",
    "mayor dinámica de grupo":     "Mayor dinámica de grupo",
    "aumentar los tiempos":        "Aumentar los tiempos de capacitación",
    "mejorar la interacción":      "Mejorar la interacción del instructor",
  };
  for (const [key, val] of Object.entries(mapa)) {
    if (t.toLowerCase().includes(key)) return [val];
  }
  return [t]; // devolver tal cual si no matchea
}

/* ─── main ────────────────────────────────────────────── */

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Agrupar filas por nombre normalizado de empresa
    const porEmpresa = new Map(); // nombre_norm → [filas]
    for (const row of RAW_ROWS) {
      const norm = normalizarEmpresa(row[1]);
      if (!porEmpresa.has(norm)) porEmpresa.set(norm, []);
      porEmpresa.get(norm).push(row);
    }

    console.log(`\nEntidades a procesar: ${porEmpresa.size}`);
    for (const [nombre] of porEmpresa) console.log(`  - ${nombre}`);

    // 2. Para cada empresa: upsert entidad → crear token → insertar respuestas
    for (const [nombreEmpresa, filas] of porEmpresa) {
      const tipo = tipoEntidad(nombreEmpresa);

      // Buscar o crear entidad (no hay UNIQUE constraint en nombre)
      const existing = await client.query(
        `SELECT id FROM entidad WHERE nombre = $1 LIMIT 1`,
        [nombreEmpresa]
      );
      let entidadId;
      if (existing.rows.length > 0) {
        entidadId = existing.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO entidad (nombre, tipo) VALUES ($1, $2) RETURNING id`,
          [nombreEmpresa, tipo]
        );
        entidadId = ins.rows[0].id;
      }
      console.log(`\n[${nombreEmpresa}] entidad_id=${entidadId} (${tipo})`);

      // Crear 1 token para esta empresa (seed histórico)
      const slug   = slugNombre(nombreEmpresa);
      const suffix = Math.random().toString(16).slice(2, 10);
      const token  = `${slug}-${suffix}`;

      const tokRes = await client.query(
        `INSERT INTO encuesta_token (entidad_id, token, descripcion, activo)
         VALUES ($1, $2, $3, false)
         RETURNING id`,
        [entidadId, token, "Importado desde Excel histórico"]
      );
      const tokenId = tokRes.rows[0].id;
      console.log(`  token_id=${tokenId}  token=${token}`);

      // Insertar respuestas
      for (const row of filas) {
        const [
          _marcaTemporal, _empresa, horarioFrac, fechaCapSerial,
          objetivos, duracion, dinamicas, aspectosRaw,
          contenido, materiales, dinamicaExp, conocimientoExp,
          recomendaria, comentarios,
        ] = row;

        const horario         = excelTimeToHHMM(horarioFrac);
        const fechaCap        = excelDateToISO(fechaCapSerial);
        const aspectos        = parseAspectos(aspectosRaw);

        await client.query(`
          INSERT INTO encuesta_respuesta (
            token_id, empresa_nombre, horario, fecha_capacitacion,
            objetivos_alcanzados, duracion_adecuada, dinamicas_correctas,
            aspectos_mejora, contenido_calif, materiales_calif,
            dinamica_expositores, conocimiento_expositores,
            recomendaria, comentarios
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        `, [
          tokenId,
          nombreEmpresa,
          horario,
          fechaCap,
          siNo(objetivos),
          siNo(duracion),
          siNo(dinamicas),
          aspectos,
          contenido  || null,
          materiales || null,
          dinamicaExp || null,
          conocimientoExp || null,
          siNo(recomendaria),
          comentarios ? comentarios.toString().trim() : null,
        ]);
        console.log(`    ✓ respuesta (${fechaCap} ${horario})`);
      }
    }

    await client.query("COMMIT");
    console.log("\n✅ Seed completado exitosamente.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌ Error — rollback:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
