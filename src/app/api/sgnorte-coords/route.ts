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
    // Buscar específicamente el marker de la emergencia (emergencyIcon), no las estaciones
    const emergencyMatch = html.match(/L\.marker\(\s*\[\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*\]\s*,\s*\{\s*icon:\s*emergencyIcon/);
    if (!emergencyMatch) return NextResponse.json({ coords: null });

    const lat = emergencyMatch[1];
    const lng = emergencyMatch[2];
    // Si las coordenadas son 0,0 el parte no tiene ubicación GPS
    if (lat === "0" || lng === "0") return NextResponse.json({ coords: null });

    return NextResponse.json({ coords: { lat, lng } });
  } catch {
    return NextResponse.json({ coords: null });
  }
}
