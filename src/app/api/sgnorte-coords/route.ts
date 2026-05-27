import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const numparte = searchParams.get("numparte");
  if (!numparte) return NextResponse.json({ error: "Falta numparte" }, { status: 400 });

  try {
    const res = await fetch(
      `https://sgonorte.bomberosperu.gob.pe/24horas/Home/Map?numparte=${encodeURIComponent(numparte)}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return NextResponse.json({ coords: null });

    const html = await res.text();
    // Extrae la primera ocurrencia de L.marker([LAT, LNG]
    const match = html.match(/L\.marker\(\s*\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]/);
    if (!match) return NextResponse.json({ coords: null });

    return NextResponse.json({ coords: { lat: match[1], lng: match[2] } });
  } catch {
    return NextResponse.json({ coords: null });
  }
}
