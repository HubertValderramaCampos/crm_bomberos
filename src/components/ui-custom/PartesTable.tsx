"use client";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Search, ChevronLeft, ChevronRight, Clock, MapPin,
  Truck, Users, ChevronDown, ChevronUp, X, Filter,
  ShieldCheck, Timer, CalendarDays,
} from "lucide-react";
import type { Parte } from "@/app/operaciones/partes/page";

interface Filtros {
  tipo: string; estado: string; busqueda: string;
  desde: string; hasta: string; distrito: string;
  categoria: string; pagina: number;
}

const TIPO_BADGE: Record<string, string> = {
  "EMERGENCIA":           "bg-red-100 text-red-700 border-red-200",
  "EMERGENCIA CANCELADA": "bg-amber-100 text-amber-700 border-amber-200",
  "COMISION":             "bg-blue-100 text-blue-700 border-blue-200",
};
const ESTADO_BADGE: Record<string, string> = {
  "CERRADO":    "bg-green-100 text-green-700 border-green-200",
  "ATENDIENDO": "bg-red-100 text-red-700 border-red-200",
};

function fmt(ts: string | null, opts?: Intl.DateTimeFormatOptions): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-PE", opts ?? { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtHora(ts: string | null): string {
  return fmt(ts, { hour: "2-digit", minute: "2-digit" });
}

function fmtFecha(ts: string | null): string {
  return fmt(ts, { day: "2-digit", month: "short", year: "numeric" });
}

function diffMin(a: string | null, b: string | null): string {
  if (!a || !b) return "—";
  const mins = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000);
  if (mins < 0 || mins > 600) return "—";
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins} min`;
}

function TimelineStep({ label, ts, color }: { label: string; ts: string | null; color: string }) {
  const hasData = !!ts;
  return (
    <div className="flex items-start gap-2">
      <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${hasData ? color : "bg-gray-200"}`} />
      <div>
        <p className={`text-[10px] font-semibold uppercase tracking-wide ${hasData ? "text-gray-500" : "text-gray-300"}`}>{label}</p>
        <p className={`text-xs font-medium ${hasData ? "text-gray-900" : "text-gray-300"}`}>{fmt(ts)}</p>
      </div>
    </div>
  );
}

function ParteRow({ parte, esBombero }: { parte: Parte; esBombero: boolean }) {
  const [open, setOpen] = useState(false);
  const tipoBadge  = TIPO_BADGE[parte.tipo]    ?? "bg-gray-100 text-gray-600 border-gray-200";
  const estadoBadge = ESTADO_BADGE[parte.estado] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const fechaRef   = parte.fecha_salida ?? parte.fecha_despacho;
  const tResp      = diffMin(parte.fecha_despacho, parte.fecha_llegada);
  const durTotal   = diffMin(parte.fecha_salida ?? parte.fecha_despacho, parte.fecha_retorno);

  return (
    <>
      <tr
        className="hover:bg-gray-50/70 cursor-pointer transition-colors border-b border-gray-100"
        onClick={() => setOpen(o => !o)}
      >
        {/* N° parte */}
        <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700 whitespace-nowrap">
          {parte.numero_parte}
        </td>

        {/* Tipo + estado */}
        <td className="px-3 py-3">
          <div className="flex flex-col gap-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap w-fit ${tipoBadge}`}>
              {parte.tipo}
            </span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border w-fit ${estadoBadge}`}>
              {parte.estado}
            </span>
          </div>
        </td>

        {/* Descripción + dirección + distrito */}
        <td className="px-3 py-3 max-w-[240px]">
          <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{parte.tipo_desc ?? parte.tipo}</p>
          {parte.direccion && (
            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0 text-gray-300" />{parte.direccion}
            </p>
          )}
          {parte.distrito && (
            <p className="text-[10px] font-medium text-blue-600 mt-0.5">{parte.distrito}</p>
          )}
        </td>

        {/* Fecha */}
        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
          <p className="font-medium text-gray-700">{fmtFecha(fechaRef)}</p>
          <p className="text-gray-400 text-[11px]">{fmtHora(fechaRef)}</p>
        </td>

        {/* T. respuesta */}
        <td className="px-3 py-3 text-xs whitespace-nowrap">
          <span className={`font-bold ${tResp === "—" ? "text-gray-300" : "text-blue-700"}`}>{tResp}</span>
          {tResp !== "—" && <p className="text-[10px] text-gray-400">despacho→llegada</p>}
        </td>

        {/* Duración */}
        <td className="px-3 py-3 text-xs whitespace-nowrap">
          <span className={`font-bold ${durTotal === "—" ? "text-gray-300" : "text-purple-700"}`}>{durTotal}</span>
          {durTotal !== "—" && <p className="text-[10px] text-gray-400">duración total</p>}
        </td>

        {/* Personal */}
        <td className="px-3 py-3 text-xs max-w-[160px]">
          {esBombero ? (
            parte.numero_efectivos != null
              ? <p className="text-[11px] text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{parte.numero_efectivos} ef.</p>
              : <span className="text-gray-300">—</span>
          ) : (
            <>
              {parte.al_mando ? (
                <p className="truncate text-gray-700 font-medium leading-tight">{parte.al_mando}</p>
              ) : parte.piloto_nombre ? (
                <p className="truncate text-gray-500">{parte.piloto_nombre.replace(/^(Ren)?tado\s+/i, "")}</p>
              ) : <span className="text-gray-300">—</span>}
              {parte.numero_efectivos != null && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3" />{parte.numero_efectivos} ef.
                </p>
              )}
            </>
          )}
        </td>

        {/* Unidades */}
        <td className="px-3 py-3">
          {parte.vehiculos.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {parte.vehiculos.map(v => (
                <span key={v} className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                  {v}
                </span>
              ))}
            </div>
          ) : <span className="text-gray-300 text-xs">—</span>}
        </td>

        <td className="px-3 py-3 w-6">
          {open
            ? <ChevronUp   className="w-4 h-4 text-gray-300 mx-auto" />
            : <ChevronDown className="w-4 h-4 text-gray-300 mx-auto" />}
        </td>
      </tr>

      {/* ── Detalle expandido ── */}
      {open && (
        <tr className="border-b border-gray-200">
          <td colSpan={9} className="bg-gray-50 px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* Timeline */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CalendarDays className="w-3 h-3" />Timeline
                </p>
                <div className="space-y-3 pl-1">
                  <TimelineStep label="Despacho" ts={parte.fecha_despacho} color="bg-amber-400" />
                  <TimelineStep label="Salida"   ts={parte.fecha_salida}   color="bg-blue-500"  />
                  <TimelineStep label="Llegada"  ts={parte.fecha_llegada}  color="bg-red-500"   />
                  <TimelineStep label="Retorno"  ts={parte.fecha_retorno}  color="bg-green-500" />
                </div>
              </div>

              {/* Tiempos */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Timer className="w-3 h-3" />Tiempos
                </p>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">T. Respuesta</p>
                    <p className="text-xl font-bold text-blue-700">{tResp}</p>
                    <p className="text-[10px] text-gray-400">Despacho → Llegada</p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duración Total</p>
                    <p className="text-xl font-bold text-purple-700">{durTotal}</p>
                    <p className="text-[10px] text-gray-400">Salida → Retorno</p>
                  </div>
                </div>
              </div>

              {/* Personal — oculto para bomberos */}
              {!esBombero && <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />Personal
                </p>
                <div className="space-y-2 text-xs">
                  {parte.al_mando && (
                    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Al Mando</p>
                      <p className="font-semibold text-gray-900 leading-tight">{parte.al_mando}</p>
                    </div>
                  )}
                  {parte.piloto_nombre && (
                    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Conductor</p>
                      <p className="font-semibold text-gray-900 leading-tight">
                        {parte.piloto_nombre.replace(/^(Ren)?tado\s+/i, "")}
                      </p>
                      {/^(Ren)?tado\s+/i.test(parte.piloto_nombre) && (
                        <span className="text-[9px] text-amber-600 font-medium">Rentado</span>
                      )}
                    </div>
                  )}
                  {parte.numero_efectivos != null && (
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">Efectivos</p>
                        <p className="font-bold text-gray-900 text-base">{parte.numero_efectivos}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>}

              {/* Ubicación + Unidades */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Truck className="w-3 h-3" />Unidades y Ubicación
                </p>
                <div className="space-y-2 text-xs">
                  {(parte.distrito || parte.direccion) && (
                    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                      {parte.distrito && (
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Distrito</p>
                      )}
                      {parte.distrito && (
                        <p className="font-semibold text-blue-700">{parte.distrito}</p>
                      )}
                      {parte.direccion && (
                        <p className="text-gray-600 text-[11px] mt-0.5 flex items-start gap-1">
                          <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-gray-400" />
                          {parte.direccion}
                        </p>
                      )}
                    </div>
                  )}
                  {parte.vehiculos.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5">Unidades despachadas</p>
                      <div className="flex flex-wrap gap-1">
                        {parte.vehiculos.map(v => (
                          <span key={v} className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-gray-700">
                            <Truck className="w-3 h-3 text-gray-400" />{v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function PartesTable({
  partes, total, pagina, totalPaginas, filtros, distritos, categorias, esBombero = false,
}: {
  partes: Parte[];
  total: number;
  pagina: number;
  totalPaginas: number;
  filtros: Filtros;
  distritos: { id: number; nombre: string }[];
  categorias: string[];
  esBombero?: boolean;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const [busqueda,  setBusqueda]  = useState(filtros.busqueda);
  const [tipo,      setTipo]      = useState(filtros.tipo);
  const [estado,    setEstado]    = useState(filtros.estado);
  const [desde,     setDesde]     = useState(filtros.desde);
  const [hasta,     setHasta]     = useState(filtros.hasta);
  const [distrito,  setDistrito]  = useState(filtros.distrito);
  const [categoria, setCategoria] = useState(filtros.categoria);

  function aplicar(override?: Partial<Filtros>) {
    const f = { busqueda, tipo, estado, desde, hasta, distrito, categoria, pagina: 1, ...override };
    const p = new URLSearchParams();
    if (f.busqueda)  p.set("q",         f.busqueda);
    if (f.tipo)      p.set("tipo",      f.tipo);
    if (f.estado)    p.set("estado",    f.estado);
    if (f.desde)     p.set("desde",     f.desde);
    if (f.hasta)     p.set("hasta",     f.hasta);
    if (f.distrito)  p.set("distrito",  f.distrito);
    if (f.categoria) p.set("categoria", f.categoria);
    if (f.pagina > 1) p.set("pagina",   String(f.pagina));
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function limpiar() {
    setBusqueda(""); setTipo(""); setEstado(""); setDesde(""); setHasta("");
    setDistrito(""); setCategoria("");
    startTransition(() => router.push(pathname));
  }

  const hayFiltros = !!(filtros.busqueda || filtros.tipo || filtros.estado || filtros.desde || filtros.hasta || filtros.distrito || filtros.categoria);
  const selectCls = "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

  return (
    <div className="space-y-4">
      {/* ── Filtros ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Fila 1: búsqueda + tipo + estado */}
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="N.° parte, dirección, bombero..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === "Enter" && aplicar()}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
            />
          </div>
          <select value={tipo} onChange={e => { setTipo(e.target.value); aplicar({ tipo: e.target.value }); }} className={selectCls}>
            <option value="">Todos los tipos</option>
            <option value="EMERGENCIA">Emergencia</option>
            <option value="EMERGENCIA CANCELADA">Cancelada</option>
            <option value="COMISION">Comisión</option>
          </select>
          <select value={estado} onChange={e => { setEstado(e.target.value); aplicar({ estado: e.target.value }); }} className={selectCls}>
            <option value="">Todos los estados</option>
            <option value="CERRADO">Cerrado</option>
            <option value="ATENDIENDO">Atendiendo</option>
          </select>
        </div>

        {/* Fila 2: distrito + categoría + fechas + botones */}
        <div className="flex flex-wrap gap-3 items-center">
          <select value={distrito} onChange={e => { setDistrito(e.target.value); aplicar({ distrito: e.target.value }); }} className={selectCls}>
            <option value="">Todos los distritos</option>
            {distritos.map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
          </select>
          <select value={categoria} onChange={e => { setCategoria(e.target.value); aplicar({ categoria: e.target.value }); }} className={selectCls}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={desde} onChange={e => { setDesde(e.target.value); aplicar({ desde: e.target.value }); }}
            className={selectCls} title="Desde" />
          <input type="date" value={hasta} onChange={e => { setHasta(e.target.value); aplicar({ hasta: e.target.value }); }}
            className={selectCls} title="Hasta" />
          <button onClick={() => aplicar()} className="px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors">
            Buscar
          </button>
          {hayFiltros && (
            <button onClick={limpiar} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["N.° Parte", "Tipo / Estado", "Descripción", "Fecha", "T. Resp.", "Duración", "Al Mando", "Unidades", ""].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap first:pl-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-sm text-gray-400">
                    No se encontraron partes con los filtros aplicados.
                  </td>
                </tr>
              ) : partes.map(p => <ParteRow key={p.id} parte={p} esBombero={esBombero} />)}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {((pagina - 1) * 30) + 1}–{Math.min(pagina * 30, total)} de {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={pagina <= 1} onClick={() => aplicar({ pagina: pagina - 1 })}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                const pg = pagina <= 3 ? i + 1 : pagina + i - 2;
                if (pg < 1 || pg > totalPaginas) return null;
                return (
                  <button key={pg} onClick={() => aplicar({ pagina: pg })}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pg === pagina ? "bg-red-700 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {pg}
                  </button>
                );
              })}
              <button disabled={pagina >= totalPaginas} onClick={() => aplicar({ pagina: pagina + 1 })}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
