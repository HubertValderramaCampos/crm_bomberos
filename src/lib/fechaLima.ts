// Perú no usa horario de verano: un offset fijo de -5h sobre UTC es exacto
// todo el año. El servidor (Vercel) corre en UTC, así que "ahora" hay que
// calcularlo con este offset y leer los getters UTC del resultado (ver el
// mismo patrón en src/app/api/formativa/asistencia/route.ts).
const OFFSET_LIMA_MS = 5 * 60 * 60 * 1000;

export function ahoraLima(): Date {
  return new Date(Date.now() - OFFSET_LIMA_MS);
}

export function fechaLima(d: Date = ahoraLima()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function horaLima(d: Date = ahoraLima()): number {
  return d.getUTCHours();
}
