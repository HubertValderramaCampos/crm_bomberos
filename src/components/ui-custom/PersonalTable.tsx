"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import type { BomberoRow } from "@/app/operaciones/personal/page";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const ESTADO_BADGE: Record<string, string> = {
  en_turno: "bg-green-100 text-green-800 border-green-200",
};

type SortKey = "horas_acumuladas" | "dias_asistidos" | "dias_guardia" | "num_emergencias" | "veces_al_mando";

export function PersonalTable({ bomberos, filtros, meses }: {
  bomberos: BomberoRow[];
  filtros: { grado: string; estado: string; busqueda: string; mes: number; anio: number };
  meses: { mes: number; anio: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [busqueda, setBusqueda] = useState(filtros.busqueda);
  const [grado, setGrado]     = useState(filtros.grado);
  const [estado, setEstado]   = useState(filtros.estado);
  const [sort, setSort]       = useState<SortKey>("horas_acumuladas");
  const [asc, setAsc]         = useState(false);

  function aplicar(override?: Partial<typeof filtros>) {
    const f = { ...filtros, busqueda, grado, estado, ...override };
    const params = new URLSearchParams();
    if (f.busqueda) params.set("q",      f.busqueda);
    if (f.grado)    params.set("grado",  f.grado);
    if (f.estado)   params.set("estado", f.estado);
    params.set("mes",  String(f.mes));
    params.set("anio", String(f.anio));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function limpiar() {
    setBusqueda(""); setGrado(""); setEstado("");
    const params = new URLSearchParams();
    params.set("mes", String(filtros.mes));
    params.set("anio", String(filtros.anio));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function toggleSort(key: SortKey) {
    if (sort === key) setAsc(a => !a);
    else { setSort(key); setAsc(false); }
  }

  const sorted = [...bomberos].sort((a, b) => {
    const va = (a[sort] ?? -1) as number;
    const vb = (b[sort] ?? -1) as number;
    return asc ? va - vb : vb - va;
  });

  const hayFiltros = !!(filtros.busqueda || filtros.grado || filtros.estado);

  function SortIcon({ col }: { col: SortKey }) {
    if (sort !== col) return <ChevronDown className="w-3 h-3 text-gray-300 inline ml-1" />;
    return asc
      ? <ChevronUp className="w-3 h-3 text-red-600 inline ml-1" />
      : <ChevronDown className="w-3 h-3 text-red-600 inline ml-1" />;
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Mes selector */}
          <select
            value={`${filtros.mes}-${filtros.anio}`}
            onChange={e => {
              const [m, a] = e.target.value.split("-").map(Number);
              aplicar({ mes: m, anio: a });
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 bg-white font-medium"
          >
            {meses.map(({ mes, anio }) => (
              <option key={`${mes}-${anio}`} value={`${mes}-${anio}`}>
                {MESES_ES[mes]} {anio}
              </option>
            ))}
          </select>

          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Apellidos, nombres, código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === "Enter" && aplicar()}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>

          {/* Grado */}
          <select
            value={grado}
            onChange={e => { setGrado(e.target.value); aplicar({ grado: e.target.value }); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 bg-white"
          >
            <option value="">Todos los grados</option>
            {["Capitán CBP","Tnte Brigadier","Teniente CBP","SubTeniente CBP","Brigadier","Seccionario"].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          {/* Estado */}
          <select
            value={estado}
            onChange={e => { setEstado(e.target.value); aplicar({ estado: e.target.value }); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="en_turno">En turno</option>
          </select>

          <button
            onClick={() => aplicar()}
            className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors"
          >
            Buscar
          </button>

          {hayFiltros && (
            <button
              onClick={limpiar}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Efectivo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort("horas_acumuladas")}
                >
                  Horas <SortIcon col="horas_acumuladas" />
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort("dias_asistidos")}
                >
                  Días asist. <SortIcon col="dias_asistidos" />
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort("dias_guardia")}
                >
                  Guardias <SortIcon col="dias_guardia" />
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort("num_emergencias")}
                >
                  Emergencias <SortIcon col="num_emergencias" />
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-600 select-none"
                  onClick={() => toggleSort("veces_al_mando")}
                >
                  Al mando <SortIcon col="veces_al_mando" />
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                    No se encontraron efectivos.
                  </td>
                </tr>
              ) : sorted.map((b, i) => {
                const estadoBadge = ESTADO_BADGE[b.estado_actual ?? ""] ?? "bg-gray-100 text-gray-400 border-gray-200";
                const maxHoras = sorted[0]?.horas_acumuladas ?? 1;
                const pct = b.horas_acumuladas ? Math.round((b.horas_acumuladas / (maxHoras || 1)) * 100) : 0;

                return (
                  <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-gray-300 w-8">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-xs font-bold text-red-700">
                          {b.apellidos.trim()[0]}{b.nombres[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 leading-tight">
                            {b.apellidos.trim()}, {b.nombres}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{b.grado} · <span className="font-mono">{b.codigo}</span></p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${estadoBadge}`}>
                        {b.estado_actual === "en_turno" ? "En turno" : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.horas_acumuladas != null ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden md:block">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{b.horas_acumuladas}h</span>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 font-medium">
                      {b.dias_asistidos ?? <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 font-medium">
                      {b.dias_guardia ?? <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 font-medium">
                      {b.num_emergencias ?? <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700 font-medium">
                      {b.veces_al_mando > 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                          {b.veces_al_mando}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/operaciones/personal/${b.id}`}
                        className="text-xs text-red-700 hover:text-red-900 font-medium whitespace-nowrap hover:underline"
                      >
                        Ver perfil →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">{sorted.length} efectivos · ordenar por columna haciendo clic</p>
        </div>
      </div>
    </div>
  );
}
