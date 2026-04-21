"use client";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Filter, RotateCcw } from "lucide-react";

const MESES = [
  { v: 1, l: "Enero" }, { v: 2, l: "Febrero" }, { v: 3, l: "Marzo" },
  { v: 4, l: "Abril" }, { v: 5, l: "Mayo" }, { v: 6, l: "Junio" },
  { v: 7, l: "Julio" }, { v: 8, l: "Agosto" }, { v: 9, l: "Septiembre" },
  { v: 10, l: "Octubre" }, { v: 11, l: "Noviembre" }, { v: 12, l: "Diciembre" },
];

export function AnalisisFiltros({
  anios, distritos, anioActual, mesActual, distritoActual,
}: {
  anios:          number[];
  distritos:      { id: number; nombre: string }[];
  anioActual:     number;
  mesActual:      number | null;
  distritoActual: number | null;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function aplicar(key: string, value: string) {
    const params = new URLSearchParams();
    if (anioActual)     params.set("anio",     String(anioActual));
    if (mesActual)      params.set("mes",      String(mesActual));
    if (distritoActual) params.set("distrito", String(distritoActual));
    if (value) params.set(key, value); else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function limpiar() {
    startTransition(() => router.push(pathname));
  }

  const hayFiltros = mesActual || distritoActual;

  const selectCls = `text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white
    focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400
    ${pending ? "opacity-60 pointer-events-none" : ""}`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="w-4 h-4 text-gray-400 shrink-0" />

      {/* Año */}
      <select
        value={anioActual}
        onChange={e => aplicar("anio", e.target.value)}
        className={selectCls}
      >
        {anios.map(a => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Mes */}
      <select
        value={mesActual ?? ""}
        onChange={e => aplicar("mes", e.target.value)}
        className={selectCls}
      >
        <option value="">Todo el año</option>
        {MESES.map(m => (
          <option key={m.v} value={m.v}>{m.l}</option>
        ))}
      </select>

      {/* Distrito */}
      <select
        value={distritoActual ?? ""}
        onChange={e => aplicar("distrito", e.target.value)}
        className={selectCls}
      >
        <option value="">Todos los distritos</option>
        {distritos.map(d => (
          <option key={d.id} value={d.id}>{d.nombre}</option>
        ))}
      </select>

      {hayFiltros && (
        <button
          onClick={limpiar}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-700 transition-colors px-2 py-2"
          title="Limpiar filtros"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpiar
        </button>
      )}

      {pending && (
        <span className="text-xs text-gray-400 animate-pulse">Cargando…</span>
      )}
    </div>
  );
}
