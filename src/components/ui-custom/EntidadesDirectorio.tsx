"use client";

import { useState } from "react";
import {
  Building2, Phone, Mail, Users, FileText, Gift,
  CalendarDays, Plus, X, ChevronRight, Search,
  BookOpen, Pencil, Check,
} from "lucide-react";

const TIPOS = ["EMPRESA", "INSTITUCIÓN PÚBLICA", "ONG", "HOSPITAL", "MUNICIPALIDAD", "OTRO"];

const TIPO_COLOR: Record<string, string> = {
  "EMPRESA":              "bg-blue-100 text-blue-700",
  "INSTITUCIÓN PÚBLICA":  "bg-purple-100 text-purple-700",
  "ONG":                  "bg-green-100 text-green-700",
  "HOSPITAL":             "bg-red-100 text-red-700",
  "MUNICIPALIDAD":        "bg-amber-100 text-amber-700",
  "OTRO":                 "bg-gray-100 text-gray-600",
};

interface Entidad {
  id: number; nombre: string; tipo: string; contacto: string | null;
  telefono: string | null; correo: string | null;
  total_actividades: number; total_oficios: number; total_donaciones: number;
}

const EMPTY_FORM = { nombre: "", tipo: "EMPRESA", contacto: "", telefono: "", correo: "", direccion: "", notas: "" };

function ModalEntidad({ inicial, onClose, onSaved }: {
  inicial?: Partial<typeof EMPTY_FORM> & { id?: number };
  onClose: () => void;
  onSaved: (e: Entidad) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...inicial });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const esEdicion = !!inicial?.id;

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setError(""); setLoading(true);
    try {
      const url    = esEdicion ? `/api/entidades/${inicial!.id}` : "/api/entidades";
      const method = esEdicion ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
      onSaved({ id: esEdicion ? inicial!.id! : data.id, ...form, total_actividades: 0, total_oficios: 0, total_donaciones: 0 } as Entidad);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <h2 className="text-base font-bold">{esEdicion ? "Editar entidad" : "Nueva entidad"}</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-3">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nombre *</label>
              <input type="text" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Municipalidad de Puente Piedra" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo</label>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className={inputCls}>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teléfono</label>
                <input type="text" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="01-123-4567" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Correo</label>
                <input type="email" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  placeholder="contacto@entidad.pe" className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Persona de contacto</label>
              <input type="text" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                placeholder="Nombre del responsable" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Dirección</label>
              <input type="text" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                placeholder="Av. ..." className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notas</label>
              <textarea rows={2} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
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
              {loading ? "Guardando..." : esEdicion ? "Actualizar" : "Crear entidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TarjetaEntidad({ e, puedeEditar, onEdit }: { e: Entidad; puedeEditar: boolean; onEdit: () => void }) {
  const badgeCls = TIPO_COLOR[e.tipo] ?? TIPO_COLOR["OTRO"];
  const total = e.total_actividades + e.total_oficios + e.total_donaciones;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-gray-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight truncate">{e.nombre}</p>
            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>{e.tipo}</span>
          </div>
        </div>
        {puedeEditar && (
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Contacto */}
      <div className="space-y-1">
        {e.contacto  && <p className="text-xs text-gray-600 flex items-center gap-1.5"><Users   className="w-3 h-3 text-gray-400 shrink-0" />{e.contacto}</p>}
        {e.telefono  && <p className="text-xs text-gray-600 flex items-center gap-1.5"><Phone   className="w-3 h-3 text-gray-400 shrink-0" />{e.telefono}</p>}
        {e.correo    && <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 text-gray-400 shrink-0" />{e.correo}</p>}
        {!e.contacto && !e.telefono && !e.correo && (
          <p className="text-xs text-gray-400 italic">Sin datos de contacto</p>
        )}
      </div>

      {/* Stats */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-100">
          <div className="text-center">
            <p className="text-base font-bold text-blue-600">{e.total_actividades}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-tight">Actividades</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-purple-600">{e.total_oficios}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-tight">Oficios</p>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-green-600">{e.total_donaciones}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-tight">Donaciones</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function EntidadesDirectorio({ entidades: inicial, puedeCrear }: { entidades: Entidad[]; puedeCrear: boolean }) {
  const [entidades, setEntidades] = useState(inicial);
  const [busqueda, setBusqueda]   = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [modal, setModal] = useState<"crear" | number | null>(null);

  const filtradas = entidades.filter(e => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || e.nombre.toLowerCase().includes(q) || (e.contacto ?? "").toLowerCase().includes(q);
    const matchT = !filtroTipo || e.tipo === filtroTipo;
    return matchQ && matchT;
  });

  function onSaved(nueva: Entidad) {
    setEntidades(prev => {
      const idx = prev.findIndex(e => e.id === nueva.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = { ...arr[idx], ...nueva }; return arr; }
      return [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
    setModal(null);
  }

  const totalActividades = entidades.reduce((s, e) => s + e.total_actividades, 0);
  const totalOficios     = entidades.reduce((s, e) => s + e.total_oficios, 0);
  const totalDonaciones  = entidades.reduce((s, e) => s + e.total_donaciones, 0);

  return (
    <div className="space-y-4">

      {/* Dashboard resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Building2,    label: "Entidades",    value: entidades.length,   color: "text-gray-700"   },
          { icon: CalendarDays, label: "Actividades",  value: totalActividades,   color: "text-blue-600"   },
          { icon: FileText,     label: "Oficios",      value: totalOficios,       color: "text-purple-600" },
          { icon: Gift,         label: "Donaciones",   value: totalDonaciones,    color: "text-green-600"  },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + botón crear */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar entidad o contacto..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
        </div>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {puedeCrear && (
          <button onClick={() => setModal("crear")}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nueva entidad
          </button>
        )}
      </div>

      {/* Grid de tarjetas */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{busqueda || filtroTipo ? "Sin resultados para esta búsqueda." : "Sin entidades registradas aún."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map(e => (
            <TarjetaEntidad key={e.id} e={e} puedeEditar={puedeCrear}
              onEdit={() => setModal(e.id)} />
          ))}
        </div>
      )}

      {/* Modal crear */}
      {modal === "crear" && (
        <ModalEntidad onClose={() => setModal(null)} onSaved={onSaved} />
      )}

      {/* Modal editar */}
      {typeof modal === "number" && (() => {
        const e = entidades.find(x => x.id === modal);
        if (!e) return null;
        return (
          <ModalEntidad
            inicial={{ id: e.id, nombre: e.nombre, tipo: e.tipo, contacto: e.contacto ?? "", telefono: e.telefono ?? "", correo: e.correo ?? "" }}
            onClose={() => setModal(null)}
            onSaved={onSaved}
          />
        );
      })()}
    </div>
  );
}
