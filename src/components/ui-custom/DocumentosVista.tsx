"use client";

import { useState, useMemo } from "react";
import {
  Search, X, FileText, Building2, User, CalendarDays,
  ChevronDown, ChevronUp, ExternalLink, Tag,
  Inbox, Clock, CheckCircle2, AlertCircle, RotateCcw,
} from "lucide-react";

interface Documento {
  id: number;
  estado: string;
  tipo_documento: string;
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

const ESTADO_BADGE: Record<string, { cls: string; label: string }> = {
  PENDIENTE:   { cls: "bg-amber-100 text-amber-700 border border-amber-200",  label: "Pendiente"   },
  EN_REVISION: { cls: "bg-blue-100 text-blue-700 border border-blue-200",     label: "En revisión" },
  APROBADO:    { cls: "bg-green-100 text-green-700 border border-green-200",  label: "Aprobado"    },
  APROBADA:    { cls: "bg-green-100 text-green-700 border border-green-200",  label: "Aprobada"    },
  ATENDIDO:    { cls: "bg-teal-100 text-teal-700 border border-teal-200",     label: "Atendido"    },
  RECHAZADO:   { cls: "bg-red-100 text-red-600 border border-red-200",        label: "Rechazado"   },
  RECHAZADA:   { cls: "bg-red-100 text-red-600 border border-red-200",        label: "Rechazada"   },
};

const SUBTIPO_LABEL: Record<string, string> = {
  CGBVP:         "CGBVP",
  MUNICIPALIDAD: "Municipalidad de Puente Piedra",
  VARIOS:        "Varios",
};

const SUBTIPO_COLOR: Record<string, string> = {
  CGBVP:         "bg-red-100 text-red-700",
  MUNICIPALIDAD: "bg-blue-100 text-blue-700",
  VARIOS:        "bg-purple-100 text-purple-700",
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

const TIPO_LABEL: Record<string, string> = {
  solicitud_capacitacion: "Sol. Capacitación",
  oficio: "Oficio", memorando: "Memorando", informe: "Informe",
  solicitud: "Solicitud", carta: "Carta", otro: "Otro",
};

function formatFecha(s: string) {
  return new Date(s).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/* ── Tarjetas KPI ── */
function KPIs({ docs }: { docs: Documento[] }) {
  const total     = docs.length;
  const pendiente = docs.filter(d => d.estado === "PENDIENTE").length;
  const revision  = docs.filter(d => d.estado === "EN_REVISION").length;
  const atendido  = docs.filter(d => ["ATENDIDO", "APROBADO", "APROBADA"].includes(d.estado)).length;
  const rechazado = docs.filter(d => ["RECHAZADO", "RECHAZADA"].includes(d.estado)).length;

  const kpis = [
    { icon: Inbox,        label: "Total",       value: total,     color: "text-gray-700",   bg: "bg-gray-50 border-gray-200" },
    { icon: Clock,        label: "Pendientes",  value: pendiente, color: "text-amber-700",  bg: "bg-amber-50 border-amber-200" },
    { icon: RotateCcw,    label: "En revisión", value: revision,  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200" },
    { icon: CheckCircle2, label: "Atendidos",   value: atendido,  color: "text-teal-700",   bg: "bg-teal-50 border-teal-200" },
    { icon: AlertCircle,  label: "Rechazados",  value: rechazado, color: "text-red-600",    bg: "bg-red-50 border-red-200" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {kpis.map(({ icon: Icon, label, value, color, bg }) => (
        <div key={label} className={`rounded-xl border px-4 py-3 ${bg}`}>
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{label}</p>
          </div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Tabla de documentos ── */
function TablaDocumentos({ docs, esAdmin, mostrarSubtipo }: {
  docs: Documento[];
  esAdmin: boolean;
  mostrarSubtipo: boolean;
}) {
  const [busqueda, setBusqueda]         = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [expandido, setExpandido]       = useState<number | null>(null);
  const [pagina, setPagina]             = useState(1);
  const POR_PAGINA = 15;

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return docs.filter(d => {
      if (filtroEstado !== "todos" && d.estado !== filtroEstado &&
          !(filtroEstado === "APROBADO" && d.estado === "APROBADA") &&
          !(filtroEstado === "RECHAZADO" && d.estado === "RECHAZADA")) return false;
      if (!q) return true;
      return (
        d.tema?.toLowerCase().includes(q) ||
        d.empresa?.toLowerCase().includes(q) ||
        d.entidad_nombre?.toLowerCase().includes(q) ||
        d.contacto?.toLowerCase().includes(q) ||
        d.descripcion?.toLowerCase().includes(q) ||
        d.subido_por_nombre?.toLowerCase().includes(q)
      );
    });
  }, [docs, busqueda, filtroEstado]);

  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA);
  const pag = Math.min(pagina, Math.max(1, totalPaginas));
  const paginados = filtrados.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  const selectCls = "border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400";

  if (docs.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 py-14 text-center text-gray-400">
      <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Sin documentos en esta categoría.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text" value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPagina(1); }}
            placeholder="Buscar por asunto, empresa, contacto..."
            className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-white"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }} className={selectCls}>
          <option value="todos">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_REVISION">En revisión</option>
          <option value="APROBADO">Aprobado</option>
          <option value="ATENDIDO">Atendido</option>
          <option value="RECHAZADO">Rechazado</option>
        </select>
        <p className="text-xs text-gray-400 ml-auto">{filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {paginados.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">Sin resultados.</p>
            <button onClick={() => { setBusqueda(""); setFiltroEstado("todos"); }} className="mt-1 text-xs text-red-600 hover:underline">Limpiar filtros</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="w-10 px-3 py-2.5"></th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Asunto</th>
                  {mostrarSubtipo && <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>}
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
                  const badge = ESTADO_BADGE[d.estado] ?? { cls: "bg-gray-100 text-gray-500", label: d.estado };
                  const cols = 4 + (mostrarSubtipo ? 1 : 0) + (esAdmin ? 1 : 0) + 2;
                  return (
                    <>
                      <tr key={d.id} onClick={() => setExpandido(abierto ? null : d.id)}
                        className={`cursor-pointer transition-colors ${abierto ? "bg-red-50/40" : "hover:bg-gray-50"}`}>
                        {/* Miniatura */}
                        <td className="px-3 py-3">
                          <div className="w-8 h-8 rounded-md overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                            {d.imagen_url
                              ? <img src={d.imagen_url} alt="" className="w-full h-full object-cover" />
                              : <FileText className="w-3.5 h-3.5 text-gray-300" />}
                          </div>
                        </td>

                        {/* Asunto */}
                        <td className="px-4 py-3 max-w-[220px]">
                          <p className="font-medium text-gray-900 truncate text-sm">{d.tema ?? "Sin asunto"}</p>
                          {d.descripcion && <p className="text-xs text-gray-400 truncate mt-0.5">{d.descripcion}</p>}
                        </td>

                        {/* Categoría oficio */}
                        {mostrarSubtipo && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {d.subtipo_oficio ? (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SUBTIPO_COLOR[d.subtipo_oficio] ?? "bg-gray-100 text-gray-600"}`}>
                                {SUBTIPO_LABEL[d.subtipo_oficio] ?? d.subtipo_oficio}
                              </span>
                            ) : <span className="text-gray-300 text-xs">—</span>}
                          </td>
                        )}

                        {/* Tipo */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLOR[d.tipo_documento] ?? "bg-gray-100 text-gray-600"}`}>
                            {TIPO_LABEL[d.tipo_documento] ?? d.tipo_documento}
                          </span>
                        </td>

                        {/* Entidad */}
                        <td className="px-4 py-3 max-w-[150px]">
                          <p className="text-xs text-gray-700 truncate flex items-center gap-1">
                            {(d.entidad_nombre || d.empresa) && <Building2 className="w-3 h-3 text-gray-400 shrink-0" />}
                            {d.entidad_nombre ?? d.empresa ?? <span className="text-gray-300">—</span>}
                          </p>
                        </td>

                        {/* Subido por */}
                        {esAdmin && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-xs text-gray-600 flex items-center gap-1">
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
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                            {abierto ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                          </div>
                        </td>
                      </tr>

                      {/* Fila expandida */}
                      {abierto && (
                        <tr key={`${d.id}-det`} className="bg-gray-50/80">
                          <td colSpan={cols} className="px-6 py-4 border-t border-gray-100">
                            <div className="flex gap-6 flex-wrap">
                              {d.imagen_url && (
                                <a href={d.imagen_url} target="_blank" rel="noopener noreferrer"
                                  className="shrink-0 block w-24 h-32 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                                  <img src={d.imagen_url} alt="Documento" className="w-full h-full object-cover" />
                                </a>
                              )}
                              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs min-w-0">
                                {d.contacto && <DataField label="Contacto" value={d.contacto} />}
                                {d.telefono && <DataField label="Teléfono" value={d.telefono} />}
                                {d.correo && <DataField label="Correo" value={d.correo} span />}
                                {d.fecha_solicitada && <DataField label="Fecha solicitud" value={formatFecha(d.fecha_solicitada)} />}
                                {(d.hora_inicio || d.hora_fin) && <DataField label="Horario" value={`${d.hora_inicio ?? ""}${d.hora_fin ? ` — ${d.hora_fin}` : ""}`} />}
                                {d.lugar && <DataField label="Lugar" value={d.lugar} />}
                                {d.num_participantes && <DataField label="Participantes" value={String(d.num_participantes)} />}
                                {d.descripcion && <DataField label="Descripción" value={d.descripcion} span />}
                                {d.notas && <DataField label="Notas" value={d.notas} span italic />}
                                {esAdmin && d.subido_por_nombre && <DataField label="Subido por" value={`${d.subido_por_nombre} · ${d.subido_por_rol === "BOMBERO" ? "Bombero" : "Admin"}`} />}
                                <DataField label="Registrado" value={formatFecha(d.creado_en)} />
                              </div>
                              <div className="flex flex-col gap-2 shrink-0">
                                {d.imagen_url && (
                                  <a href={d.imagen_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 whitespace-nowrap">
                                    <ExternalLink className="w-3 h-3" /> Ver imagen
                                  </a>
                                )}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg">
                                  <Tag className="w-3 h-3" />{TIPO_LABEL[d.tipo_documento] ?? d.tipo_documento}
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
            {(pag - 1) * POR_PAGINA + 1}–{Math.min(pag * POR_PAGINA, filtrados.length)} de {filtrados.length}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pag === 1}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Anterior</button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const start = Math.max(1, Math.min(pag - 2, totalPaginas - 4));
              const num = start + i;
              return (
                <button key={num} onClick={() => setPagina(num)}
                  className={`px-3 py-1.5 text-xs border rounded-lg ${num === pag ? "bg-red-700 text-white border-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {num}
                </button>
              );
            })}
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pag === totalPaginas}
              className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DataField({ label, value, span, italic }: { label: string; value: string; span?: boolean; italic?: boolean }) {
  return (
    <div className={span ? "col-span-2 sm:col-span-3" : ""}>
      <p className="text-gray-400 font-semibold uppercase tracking-wide text-[10px]">{label}</p>
      <p className={`text-gray-800 ${italic ? "italic text-gray-600" : ""}`}>{value}</p>
    </div>
  );
}

/* ── Componente raíz ── */
export function DocumentosVista({
  documentos, esAdmin, vistaOficio,
}: {
  documentos: Documento[];
  esAdmin: boolean;
  vistaOficio?: "institucionales" | "varios";
}) {
  const [tab, setTab] = useState<"institucionales" | "varios" | "otros">(
    vistaOficio ?? "institucionales"
  );

  const inst   = documentos.filter(d => d.tipo_documento === "oficio" && ["CGBVP", "MUNICIPALIDAD"].includes(d.subtipo_oficio ?? ""));
  const varios = documentos.filter(d => d.tipo_documento === "oficio" && d.subtipo_oficio === "VARIOS");
  const otros  = documentos.filter(d => d.tipo_documento !== "oficio");

  // En vistas de oficio específicas no mostramos tabs, solo la tabla directa
  if (vistaOficio) {
    const docs = vistaOficio === "institucionales" ? inst : varios;
    return (
      <div className="space-y-4">
        <KPIs docs={docs} />
        <TablaDocumentos
          docs={docs}
          esAdmin={esAdmin}
          mostrarSubtipo={vistaOficio === "institucionales"}
        />
      </div>
    );
  }

  const tabs = [
    { key: "institucionales" as const, label: "Oficios Institucionales", count: inst.length },
    { key: "varios"          as const, label: "Oficios Varios",          count: varios.length },
    { key: "otros"           as const, label: "Otros documentos",        count: otros.length },
  ];

  const docsActivos = tab === "institucionales" ? inst : tab === "varios" ? varios : otros;

  return (
    <div className="space-y-4">
      <KPIs docs={documentos} />

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
              tab === t.key ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-500"
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      <TablaDocumentos
        docs={docsActivos}
        esAdmin={esAdmin}
        mostrarSubtipo={tab === "institucionales"}
      />
    </div>
  );
}
