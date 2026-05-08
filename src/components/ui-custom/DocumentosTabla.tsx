"use client";

import { useState, useMemo } from "react";
import {
  Search, X, FileText, Building2, User, CalendarDays,
  ChevronDown, ChevronUp, ExternalLink, Filter, Tag,
} from "lucide-react";

type TipoDoc = "solicitud_capacitacion" | "oficio" | "memorando" | "informe" | "solicitud" | "carta" | "otro";

interface Documento {
  id: number;
  estado: string;
  tipo_documento: TipoDoc;
  subtipo_oficio: string | null;
  empresa: string | null;
  tema: string | null;
  descripcion: string | null;
  notas: string | null;
  fecha_solicitada: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  lugar: string | null;
  num_participantes: number | null;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  entidad_id: number | null;
  entidad_nombre: string | null;
  subido_por_rol: string | null;
  subido_por_nombre: string | null;
  imagen_key: string | null;
  imagen_url: string | null;
  creado_en: string;
}

const TIPO_LABEL: Record<string, string> = {
  solicitud_capacitacion: "Solicitud Capacitación",
  oficio:    "Oficio",
  memorando: "Memorando",
  informe:   "Informe",
  solicitud: "Solicitud",
  carta:     "Carta",
  otro:      "Otro",
};

const TIPO_COLOR: Record<string, string> = {
  solicitud_capacitacion: "bg-red-100 text-red-700",
  oficio:    "bg-blue-100 text-blue-700",
  memorando: "bg-purple-100 text-purple-700",
  informe:   "bg-amber-100 text-amber-700",
  solicitud: "bg-teal-100 text-teal-700",
  carta:     "bg-green-100 text-green-700",
  otro:      "bg-gray-100 text-gray-600",
};

const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE:   "bg-amber-100 text-amber-700",
  EN_REVISION: "bg-blue-100 text-blue-700",
  APROBADO:    "bg-green-100 text-green-700",
  APROBADA:    "bg-green-100 text-green-700",
  ATENDIDO:    "bg-teal-100 text-teal-700",
  RECHAZADO:   "bg-red-100 text-red-600",
  RECHAZADA:   "bg-red-100 text-red-600",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE:   "Pendiente",
  EN_REVISION: "En revisión",
  APROBADO:    "Aprobado",
  APROBADA:    "Aprobada",
  ATENDIDO:    "Atendido",
  RECHAZADO:   "Rechazado",
  RECHAZADA:   "Rechazada",
};

const SUBTIPO_LABEL: Record<string, string> = {
  CGBVP:         "CGBVP",
  MUNICIPALIDAD: "Municipalidad",
  VARIOS:        "Varios",
};

function tipoLabel(doc: Documento): string {
  if (doc.tipo_documento === "oficio" && doc.subtipo_oficio) {
    return `Oficio ${SUBTIPO_LABEL[doc.subtipo_oficio] ?? doc.subtipo_oficio}`;
  }
  return TIPO_LABEL[doc.tipo_documento] ?? doc.tipo_documento;
}

function formatFecha(s: string) {
  return new Date(s).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function DocumentosTabla({ documentos, esAdmin }: { documentos: Documento[]; esAdmin: boolean }) {
  const [busqueda, setBusqueda]       = useState("");
  const [filtroTipo, setFiltroTipo]   = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroSubtipo, setFiltroSubtipo] = useState("todos");
  const [expandido, setExpandido]     = useState<number | null>(null);
  const [pagina, setPagina]           = useState(1);
  const POR_PAGINA = 15;

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return documentos.filter(d => {
      if (filtroTipo !== "todos" && d.tipo_documento !== filtroTipo) return false;
      if (filtroEstado !== "todos" && d.estado !== filtroEstado && !(filtroEstado === "APROBADO" && d.estado === "APROBADA") && !(filtroEstado === "RECHAZADO" && d.estado === "RECHAZADA")) return false;
      if (filtroSubtipo !== "todos") {
        if (filtroSubtipo === "sin_subtipo") {
          if (d.tipo_documento !== "oficio" || d.subtipo_oficio) return false;
        } else {
          if (d.subtipo_oficio !== filtroSubtipo) return false;
        }
      }
      if (!q) return true;
      return (
        d.tema?.toLowerCase().includes(q) ||
        d.empresa?.toLowerCase().includes(q) ||
        d.entidad_nombre?.toLowerCase().includes(q) ||
        d.contacto?.toLowerCase().includes(q) ||
        d.descripcion?.toLowerCase().includes(q) ||
        d.subido_por_nombre?.toLowerCase().includes(q) ||
        d.lugar?.toLowerCase().includes(q)
      );
    });
  }, [documentos, busqueda, filtroTipo, filtroEstado, filtroSubtipo]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const pagina_ = Math.min(pagina, Math.max(1, totalPaginas));
  const paginados = filtrados.slice((pagina_ - 1) * POR_PAGINA, pagina_ * POR_PAGINA);

  function resetFiltros() {
    setBusqueda(""); setFiltroTipo("todos"); setFiltroEstado("todos"); setFiltroSubtipo("todos"); setPagina(1);
  }

  const hayFiltros = busqueda || filtroTipo !== "todos" || filtroEstado !== "todos" || filtroSubtipo !== "todos";

  const selectCls = "border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400";

  return (
    <div className="space-y-3">
      {/* Barra de filtros */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-center">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            placeholder="Buscar por asunto, empresa, contacto..."
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />

          {/* Tipo */}
          <select value={filtroTipo} onChange={e => { setFiltroTipo(e.target.value); setPagina(1); }} className={selectCls}>
            <option value="todos">Todos los tipos</option>
            <option value="solicitud_capacitacion">Solicitud Capacitación</option>
            <option value="oficio">Oficio</option>
            <option value="memorando">Memorando</option>
            <option value="informe">Informe</option>
            <option value="solicitud">Solicitud</option>
            <option value="carta">Carta</option>
            <option value="otro">Otro</option>
          </select>

          {/* Subtipo oficio — solo visible si tipo es oficio o todos */}
          {(filtroTipo === "todos" || filtroTipo === "oficio") && (
            <select value={filtroSubtipo} onChange={e => { setFiltroSubtipo(e.target.value); setPagina(1); }} className={selectCls}>
              <option value="todos">Todos los oficios</option>
              <option value="CGBVP">CGBVP</option>
              <option value="MUNICIPALIDAD">Municipalidad</option>
              <option value="VARIOS">Varios</option>
              <option value="sin_subtipo">Sin clasificar</option>
            </select>
          )}

          {/* Estado */}
          <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }} className={selectCls}>
            <option value="todos">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="APROBADO">Aprobado</option>
            <option value="ATENDIDO">Atendido</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>

          {hayFiltros && (
            <button onClick={resetFiltros} className="flex items-center gap-1 text-xs text-red-600 hover:underline font-medium">
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        <p className="text-xs text-gray-400 ml-auto shrink-0">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {paginados.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin documentos con esos filtros.</p>
            {hayFiltros && <button onClick={resetFiltros} className="mt-2 text-xs text-red-600 hover:underline">Limpiar filtros</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide w-8"></th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Asunto</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Entidad / Empresa</th>
                  {esAdmin && <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Subido por</th>}
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginados.map(d => {
                  const abierto = expandido === d.id;
                  return (
                    <>
                      <tr
                        key={d.id}
                        onClick={() => setExpandido(abierto ? null : d.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {/* Miniatura */}
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-md overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                            {d.imagen_url
                              ? <img src={d.imagen_url} alt="" className="w-full h-full object-cover" />
                              : <FileText className="w-3.5 h-3.5 text-gray-300" />
                            }
                          </div>
                        </td>

                        {/* Asunto */}
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="font-medium text-gray-900 truncate text-sm">{d.tema ?? "Sin asunto"}</p>
                          {d.descripcion && <p className="text-xs text-gray-400 truncate mt-0.5">{d.descripcion}</p>}
                        </td>

                        {/* Tipo */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLOR[d.tipo_documento] ?? "bg-gray-100 text-gray-600"}`}>
                            {tipoLabel(d)}
                          </span>
                        </td>

                        {/* Entidad */}
                        <td className="px-4 py-3 max-w-[160px]">
                          <p className="text-xs text-gray-700 truncate flex items-center gap-1">
                            {(d.entidad_nombre || d.empresa) && <Building2 className="w-3 h-3 text-gray-400 shrink-0" />}
                            {d.entidad_nombre ?? d.empresa ?? <span className="text-gray-300">—</span>}
                          </p>
                        </td>

                        {/* Subido por (solo admin) */}
                        {esAdmin && (
                          <td className="px-4 py-3">
                            <p className="text-xs text-gray-600 flex items-center gap-1 whitespace-nowrap">
                              <User className="w-3 h-3 text-gray-400 shrink-0" />
                              {d.subido_por_nombre ?? "—"}
                            </p>
                          </td>
                        )}

                        {/* Fecha */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3 text-gray-400 shrink-0" />
                            {formatFecha(d.creado_en)}
                          </p>
                        </td>

                        {/* Estado */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLOR[d.estado] ?? "bg-gray-100 text-gray-500"}`}>
                              {ESTADO_LABEL[d.estado] ?? d.estado}
                            </span>
                            {abierto
                              ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            }
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida */}
                      {abierto && (
                        <tr key={`${d.id}-det`} className="bg-gray-50">
                          <td colSpan={esAdmin ? 7 : 6} className="px-6 py-4">
                            <div className="flex gap-6 flex-wrap">
                              {/* Imagen */}
                              {d.imagen_url && (
                                <a href={d.imagen_url} target="_blank" rel="noopener noreferrer"
                                  className="shrink-0 block w-28 h-36 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                  <img src={d.imagen_url} alt="Documento" className="w-full h-full object-cover" />
                                </a>
                              )}

                              {/* Datos */}
                              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs min-w-0">
                                {d.contacto && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Contacto</p><p className="text-gray-800">{d.contacto}</p></div>
                                )}
                                {d.telefono && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Teléfono</p><p className="text-gray-800">{d.telefono}</p></div>
                                )}
                                {d.correo && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Correo</p><p className="text-gray-800 truncate">{d.correo}</p></div>
                                )}
                                {d.fecha_solicitada && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Fecha solicitud</p><p className="text-gray-800">{formatFecha(d.fecha_solicitada)}</p></div>
                                )}
                                {(d.hora_inicio || d.hora_fin) && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Horario</p><p className="text-gray-800">{d.hora_inicio}{d.hora_fin ? ` — ${d.hora_fin}` : ""}</p></div>
                                )}
                                {d.lugar && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Lugar</p><p className="text-gray-800">{d.lugar}</p></div>
                                )}
                                {d.num_participantes && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Participantes</p><p className="text-gray-800">{d.num_participantes}</p></div>
                                )}
                                {d.descripcion && (
                                  <div className="col-span-2 sm:col-span-3"><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Descripción</p><p className="text-gray-800">{d.descripcion}</p></div>
                                )}
                                {d.notas && (
                                  <div className="col-span-2 sm:col-span-3"><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Notas</p><p className="text-gray-700 italic">{d.notas}</p></div>
                                )}
                                {esAdmin && d.subido_por_nombre && (
                                  <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Subido por</p><p className="text-gray-800">{d.subido_por_nombre} · {d.subido_por_rol === "BOMBERO" ? "Bombero" : "Admin"}</p></div>
                                )}
                                <div><p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">Registrado</p><p className="text-gray-800">{formatFecha(d.creado_en)}</p></div>
                              </div>

                              {/* Acciones */}
                              <div className="flex flex-col gap-2 shrink-0">
                                {d.imagen_url && (
                                  <a href={d.imagen_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50">
                                    <ExternalLink className="w-3 h-3" /> Ver imagen
                                  </a>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg">
                                  <Tag className="w-3 h-3" />
                                  <span>{tipoLabel(d)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            Mostrando {(pagina_ - 1) * POR_PAGINA + 1}–{Math.min(pagina_ * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina_ === 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const start = Math.max(1, Math.min(pagina_ - 2, totalPaginas - 4));
              const num = start + i;
              return (
                <button
                  key={num}
                  onClick={() => setPagina(num)}
                  className={`px-3 py-1.5 text-xs border rounded-lg ${num === pagina_ ? "bg-red-700 text-white border-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {num}
                </button>
              );
            })}
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina_ === totalPaginas}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
