import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import pool from "@/lib/db";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
}

function similitud(a: string, b: string): number {
  const na = normalizar(a);
  const nb = normalizar(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wordsA = new Set(na.split(/\s+/));
  const wordsB = nb.split(/\s+/);
  const matches = wordsB.filter(w => w.length > 3 && wordsA.has(w)).length;
  const score = matches / Math.max(wordsA.size, wordsB.length);
  return score;
}

const PROMPT = `Analiza esta imagen de un documento oficial y clasifícalo.

Responde SIEMPRE con un JSON válido con esta estructura exacta:
{
  "es_solicitud_capacitacion": true/false,
  "confianza": "alta" | "media" | "baja",
  "tipo_documento": "solicitud_capacitacion" | "oficio" | "memorando" | "informe" | "solicitud" | "carta" | "otro",
  "descripcion_documento": "breve descripción de lo que es el documento (máx 1 oración)",
  "datos": {
    "empresa": "nombre de la empresa, institución u organización remitente (o null)",
    "contacto": "nombre del firmante o contacto principal (o null)",
    "telefono": "teléfono (o null)",
    "correo": "correo electrónico (o null)",
    "tema": "asunto principal o título del documento (o null)",
    "descripcion": "descripción detallada del contenido (o null)",
    "fecha_solicitada": "fecha propuesta o de referencia en formato YYYY-MM-DD (o null)",
    "hora_inicio": "hora inicio en formato HH:MM (o null)",
    "hora_fin": "hora fin en formato HH:MM (o null)",
    "lugar": "lugar mencionado (o null)",
    "num_participantes": número entero de participantes si se menciona (o null)
  }
}

Instrucciones de clasificación:
- "solicitud_capacitacion": pide explícitamente una capacitación, charla, curso o taller para bomberos
- "oficio": documento oficial numerado dirigido a una institución
- "memorando": comunicación interna entre áreas
- "informe": reporte o informe de actividades/incidentes
- "solicitud": solicitud formal que NO sea de capacitación
- "carta": comunicación menos formal
- "otro": cualquier otro tipo

Extrae todos los datos posibles independientemente del tipo de documento.
No incluyas texto fuera del JSON.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { imagen } = await req.json();
  if (!imagen) return NextResponse.json({ error: "Imagen requerida" }, { status: 400 });

  // imagen viene como data URL: "data:image/jpeg;base64,..."
  const base64 = imagen.includes(",") ? imagen.split(",")[1] : imagen;
  const mimeMatch = imagen.match(/data:([^;]+);/);
  const mimeType = (mimeMatch?.[1] ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" } },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned);

    // Buscar entidad sugerida en la base de datos
    const empresa = result.datos?.empresa as string | null;
    let entidad_sugerida: { id: number; nombre: string; tipo: string; confianza: "alta" | "media" } | null = null;
    let entidad_sugerida_nombre: string | null = null;

    if (empresa && empresa.trim().length > 2) {
      try {
        const { rows } = await pool.query<{ id: number; nombre: string; tipo: string }>(
          "SELECT id, nombre, tipo FROM entidad ORDER BY nombre"
        );
        let mejorScore = 0;
        let mejorEntidad: { id: number; nombre: string; tipo: string } | null = null;
        for (const e of rows) {
          const score = similitud(empresa, e.nombre);
          if (score > mejorScore) { mejorScore = score; mejorEntidad = e; }
        }
        if (mejorEntidad && mejorScore >= 0.8) {
          entidad_sugerida = { ...mejorEntidad, confianza: mejorScore >= 0.95 ? "alta" : "media" };
        } else {
          // Sin coincidencia — sugerir nombre para crear
          entidad_sugerida_nombre = empresa.trim();
        }
      } catch { /* no bloquear si falla el match */ }
    }

    return NextResponse.json({ ...result, entidad_sugerida, entidad_sugerida_nombre });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al analizar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
