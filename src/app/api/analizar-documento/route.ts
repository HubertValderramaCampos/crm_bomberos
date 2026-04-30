import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PROMPT = `Analiza esta imagen de un documento. Tu tarea es determinar si contiene una solicitud de capacitación para bomberos.

Responde SIEMPRE con un JSON válido con esta estructura exacta:
{
  "es_solicitud_capacitacion": true/false,
  "confianza": "alta" | "media" | "baja",
  "tipo_documento": "solicitud_capacitacion" | "oficio" | "memorando" | "informe" | "otro",
  "descripcion_documento": "breve descripción de lo que es el documento",
  "datos": {
    "empresa": "nombre de la empresa o institución que solicita (o null)",
    "contacto": "nombre del contacto o firmante (o null)",
    "telefono": "teléfono (o null)",
    "correo": "correo electrónico (o null)",
    "tema": "tema o título de la capacitación solicitada (o null)",
    "descripcion": "descripción detallada de lo que solicitan (o null)",
    "fecha_solicitada": "fecha en formato YYYY-MM-DD (o null si no se menciona)",
    "hora_inicio": "hora inicio en formato HH:MM (o null)",
    "hora_fin": "hora fin en formato HH:MM (o null)",
    "lugar": "lugar propuesto (o null)",
    "num_participantes": número entero de participantes (o null)
  }
}

Si no es una solicitud de capacitación, igual devuelve el JSON con es_solicitud_capacitacion: false y datos con todos los campos en null.
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
    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al analizar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
