"use client";

import { useState } from "react";
import { Briefcase, Phone, Mail, Plus, X, Search, Pencil, Trash2, User } from "lucide-react";

const TIPOS_PROCESO = [
  "CONVENIO", "DONACIÓN", "CAPACITACIÓN", "PATROCINIO", "SERVICIO", "ALIANZA", "OTRO"
];
const ESTADOS = ["ACTIVO", "INACTIVO", "EN NEGOCIACIÓN"];

const PROCESO_COLOR: Record<string, string> = {
  "CONVENIO":       "bg-blue-100 text-blue-700",
  "DONACIÓN":       "bg-green-100 text-green-700",
  "CAPACITACIÓN":   "bg-purple-100 text-purple-700",
  "PATROCINIO":     "bg-amber-100 text-amber-700",
  "SERVICIO":       "bg-cyan-100 text-cyan-700",
  "ALIANZA":        "bg-rose-100 text-rose-700",
  "OTRO":           "bg-gray-100 text-gray-600",
};

const ESTADO_COLOR: Record<string, string> = {
  "ACTIVO":          "bg-emerald-100 text-emerald-700",
  "INACTIVO":        "bg-gray-100 text-gray-500",
  "EN NEGOCIACIÓN":  "bg-amber-100 text-amber-700",
};

export interface Socio {
  id: number;
  empresa: string;
  tipo_proceso: string;
  contacto: string | null;
  telefono: string | null;
  correo: string | null;
  estado: string;
  notas: string | null;
  clasificacion_id?: number | null;
  tamano?: string | null;
  tipo_apoyo?: string | null;
  nivel?: string | null;
}

const EMPTY_FORM = {
  empresa: "", tipo_proceso: "CONVENIO", contacto: "",
  telefono: "", correo: "", estado: "ACTIVO", notas: "",
};

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

function ModalSocio({ inicial, onClose, onSaved }: {
  inicial?: Partial<typeof EMPTY_FORM> & { id?: number };
  onClose: () => void;
  onSaved: (s: Socio) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...inicial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const esEdicion = !!inicial?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.empresa.trim()) { setError("El nombre de la empresa es obligatorio."); return; }
    setError(""); setLoading(true);
    try {
      const url    = esEdicion ? `/api/socios-estrategicos/${inicial!.id}` : "/api/socios-estrategicos";
      const method = esEdicion ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
      onSaved({ id: esEdicion ? inicial!.id! : data.id, ...form } as Socio);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            <h2 className="text-base font-bold">{esEdicion ? "Editar socio" : "Nuevo socio estratégico"}</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-3">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Empresa *</label>
              <input type="text" required value={form.empresa}
                onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                placeholder="Ej: Corporación XYZ S.A.C." className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de proceso *</label>
                <select value={form.tipo_proceso} onChange={e => setForm(f => ({ ...f, tipo_proceso: e.target.value }))} className={inputCls}>
                  {TIPOS_PROCESO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado</label>
                <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} className={inputCls}>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Persona de contacto</label>
              <input type="text" value={form.contacto}
                onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                placeholder="Nombre del responsable" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teléfono</label>
                <input type="text" value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="01-123-4567" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo</label>
                <input type="email" value={form.correo}
                  onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  placeholder="contacto@empresa.pe" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notas</label>
              <textarea rows={2} value={form.notas}
                onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                placeholder="Observaciones adicionales..." className={`${inputCls} resize-none`} />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg transition-colors">
              {loading ? "Guardando..." : esEdicion ? "Actualizar" : "Crear socio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TarjetaSocio({ s, puedeEditar, onEdit, onDelete }: {
  s: Socio; puedeEditar: boolean; onEdit: () => void; onDelete: () => void;
}) {
  const procesoBadge = PROCESO_COLOR[s.tipo_proceso] ?? PROCESO_COLOR["OTRO"];
  const estadoBadge  = ESTADO_COLOR[s.estado] ?? ESTADO_COLOR["INACTIVO"];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{s.empresa}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${procesoBadge}`}>{s.tipo_proceso}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoBadge}`}>{s.estado}</span>
            </div>
          </div>
        </div>
        {puedeEditar && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-1">
        {s.contacto  && <p className="text-xs text-gray-600 flex items-center gap-1.5"><User    className="w-3 h-3 text-gray-400 shrink-0" />{s.contacto}</p>}
        {s.telefono  && <p className="text-xs text-gray-600 flex items-center gap-1.5"><Phone   className="w-3 h-3 text-gray-400 shrink-0" />{s.telefono}</p>}
        {s.correo    && <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 text-gray-400 shrink-0" />{s.correo}</p>}
        {!s.contacto && !s.telefono && !s.correo && (
          <p className="text-xs text-gray-400 italic">Sin datos de contacto</p>
        )}
      </div>

      {(s.tamano || s.tipo_apoyo) && (
        <div className="pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
          {s.tamano    && <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{s.tamano}</span>}
          {s.tipo_apoyo && <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">{s.tipo_apoyo}</span>}
          {s.nivel     && <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full font-medium">{s.nivel}</span>}
        </div>
      )}
    </div>
  );
}

export function SociosEstrategicos({ socios: inicial, puedeAdmin }: { socios: Socio[]; puedeAdmin: boolean }) {
  const [socios, setSocios] = useState(inicial);
  const [busqueda, setBusqueda] = useState("");
  const [filtroProceso, setFiltroProceso] = useState("");
  const [modal, setModal] = useState<"crear" | number | null>(null);

  const filtrados = socios.filter(s => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || s.empresa.toLowerCase().includes(q) || (s.contacto ?? "").toLowerCase().includes(q);
    const matchP = !filtroProceso || s.tipo_proceso === filtroProceso;
    return matchQ && matchP;
  });

  function onSaved(nuevo: Socio) {
    setSocios(prev => {
      const idx = prev.findIndex(s => s.id === nuevo.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = { ...arr[idx], ...nuevo }; return arr; }
      return [...prev, nuevo].sort((a, b) => a.empresa.localeCompare(b.empresa));
    });
    setModal(null);
  }

  async function onDelete(id: number) {
    if (!confirm("¿Eliminar este socio estratégico?")) return;
    await fetch(`/api/socios-estrategicos/${id}`, { method: "DELETE" });
    setSocios(prev => prev.filter(s => s.id !== id));
  }

  const activos = socios.filter(s => s.estado === "ACTIVO").length;
  const enNeg   = socios.filter(s => s.estado === "EN NEGOCIACIÓN").length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Total socios",     value: socios.length, color: "text-gray-700" },
          { label: "Activos",          value: activos,       color: "text-emerald-600" },
          { label: "En negociación",   value: enNeg,         color: "text-amber-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar empresa o contacto..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
        </div>
        <select value={filtroProceso} onChange={e => setFiltroProceso(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los procesos</option>
          {TIPOS_PROCESO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {puedeAdmin && (
          <button onClick={() => setModal("crear")}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nuevo socio
          </button>
        )}
      </div>

      {/* Grid */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{busqueda || filtroProceso ? "Sin resultados." : "Sin socios estratégicos registrados."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(s => (
            <TarjetaSocio key={s.id} s={s} puedeEditar={puedeAdmin}
              onEdit={() => setModal(s.id)}
              onDelete={() => onDelete(s.id)} />
          ))}
        </div>
      )}

      {modal === "crear" && <ModalSocio onClose={() => setModal(null)} onSaved={onSaved} />}
      {typeof modal === "number" && (() => {
        const s = socios.find(x => x.id === modal);
        if (!s) return null;
        return (
          <ModalSocio
            inicial={{ id: s.id, empresa: s.empresa, tipo_proceso: s.tipo_proceso, contacto: s.contacto ?? "", telefono: s.telefono ?? "", correo: s.correo ?? "", estado: s.estado, notas: s.notas ?? "" }}
            onClose={() => setModal(null)}
            onSaved={onSaved}
          />
        );
      })()}
    </div>
  );
}
