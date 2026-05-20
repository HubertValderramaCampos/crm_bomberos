"use client";

import { useState } from "react";
import { Tag, Plus, X, Search, Pencil, Trash2, LayoutGrid } from "lucide-react";

const TAMANOS = ["MICRO", "PEQUEÑA", "MEDIANA", "GRANDE", "CORPORATIVA"];
const TIPOS_APOYO = [
  "ECONÓMICO", "EN ESPECIE", "LOGÍSTICO", "TÉCNICO", "FORMATIVO", "COMUNICACIONAL", "OTRO"
];
const NIVELES = ["BAJO", "MEDIO", "ALTO", "ESTRATÉGICO"];

const TAMANO_COLOR: Record<string, string> = {
  "MICRO":       "bg-gray-100 text-gray-600",
  "PEQUEÑA":     "bg-blue-100 text-blue-700",
  "MEDIANA":     "bg-indigo-100 text-indigo-700",
  "GRANDE":      "bg-purple-100 text-purple-700",
  "CORPORATIVA": "bg-rose-100 text-rose-700",
};

const NIVEL_COLOR: Record<string, string> = {
  "BAJO":        "bg-gray-100 text-gray-500",
  "MEDIO":       "bg-amber-100 text-amber-700",
  "ALTO":        "bg-orange-100 text-orange-700",
  "ESTRATÉGICO": "bg-red-100 text-red-700",
};

export interface Clasificacion {
  id: number;
  socio_id: number;
  socio_empresa: string;
  tamano: string;
  tipo_apoyo: string;
  nivel: string;
  descripcion: string | null;
}

export interface SocioOpcion { id: number; empresa: string; }

const EMPTY_FORM = {
  socio_id: "" as string | number,
  tamano: "MEDIANA",
  tipo_apoyo: "ECONÓMICO",
  nivel: "MEDIO",
  descripcion: "",
};

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

function ModalClasificacion({ inicial, socios, onClose, onSaved }: {
  inicial?: Partial<typeof EMPTY_FORM> & { id?: number };
  socios: SocioOpcion[];
  onClose: () => void;
  onSaved: (c: Clasificacion) => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...inicial });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const esEdicion = !!inicial?.id;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.socio_id) { setError("Selecciona un socio."); return; }
    if (!form.tamano || !form.tipo_apoyo) { setError("Tamaño y tipo de apoyo son obligatorios."); return; }
    setError(""); setLoading(true);
    try {
      const url    = esEdicion ? `/api/clasificacion-socios/${inicial!.id}` : "/api/clasificacion-socios";
      const method = esEdicion ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, socio_id: Number(form.socio_id) }) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar."); return; }
      const socio  = socios.find(s => s.id === Number(form.socio_id));
      onSaved({ id: esEdicion ? inicial!.id! : data.id, ...form, socio_id: Number(form.socio_id), socio_empresa: socio?.empresa ?? "" } as Clasificacion);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            <h2 className="text-base font-bold">{esEdicion ? "Editar clasificación" : "Nueva clasificación"}</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 space-y-3">
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Socio estratégico *</label>
              <select value={form.socio_id} onChange={e => setForm(f => ({ ...f, socio_id: e.target.value }))} className={inputCls}>
                <option value="">Seleccionar socio...</option>
                {socios.map(s => <option key={s.id} value={s.id}>{s.empresa}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tamaño *</label>
                <select value={form.tamano} onChange={e => setForm(f => ({ ...f, tamano: e.target.value }))} className={inputCls}>
                  {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nivel</label>
                <select value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value }))} className={inputCls}>
                  {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de apoyo *</label>
              <select value={form.tipo_apoyo} onChange={e => setForm(f => ({ ...f, tipo_apoyo: e.target.value }))} className={inputCls}>
                {TIPOS_APOYO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción</label>
              <textarea rows={2} value={form.descripcion ?? ""}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                placeholder="Detalles del tipo de apoyo o acuerdo..." className={`${inputCls} resize-none`} />
            </div>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-lg transition-colors">
              {loading ? "Guardando..." : esEdicion ? "Actualizar" : "Crear clasificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClasificacionSocios({ clasificaciones: inicial, socios, puedeAdmin }: {
  clasificaciones: Clasificacion[];
  socios: SocioOpcion[];
  puedeAdmin: boolean;
}) {
  const [items, setItems] = useState(inicial);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTamano, setFiltroTamano] = useState("");
  const [filtroNivel, setFiltroNivel] = useState("");
  const [modal, setModal] = useState<"crear" | number | null>(null);

  const filtrados = items.filter(c => {
    const q = busqueda.toLowerCase();
    const matchQ = !q || c.socio_empresa.toLowerCase().includes(q);
    const matchT = !filtroTamano || c.tamano === filtroTamano;
    const matchN = !filtroNivel  || c.nivel   === filtroNivel;
    return matchQ && matchT && matchN;
  });

  function onSaved(nueva: Clasificacion) {
    setItems(prev => {
      const idx = prev.findIndex(c => c.id === nueva.id);
      if (idx >= 0) { const arr = [...prev]; arr[idx] = nueva; return arr; }
      return [...prev, nueva].sort((a, b) => a.socio_empresa.localeCompare(b.socio_empresa));
    });
    setModal(null);
  }

  async function onDelete(id: number) {
    if (!confirm("¿Eliminar esta clasificación?")) return;
    await fetch(`/api/clasificacion-socios/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(c => c.id !== id));
  }

  const estrategicos = items.filter(c => c.nivel === "ESTRATÉGICO").length;
  const corporativas  = items.filter(c => c.tamano === "CORPORATIVA").length;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Clasificaciones",  value: items.length,   color: "text-gray-700"    },
          { label: "Nivel estratégico", value: estrategicos,  color: "text-red-600"     },
          { label: "Corporativas",      value: corporativas,  color: "text-purple-600"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por empresa..."
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400" />
        </div>
        <select value={filtroTamano} onChange={e => setFiltroTamano(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los tamaños</option>
          {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroNivel} onChange={e => setFiltroNivel(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30">
          <option value="">Todos los niveles</option>
          {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        {puedeAdmin && (
          <button onClick={() => setModal("crear")}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" /> Nueva clasificación
          </button>
        )}
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <LayoutGrid className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{busqueda || filtroTamano || filtroNivel ? "Sin resultados." : "Sin clasificaciones registradas."}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tamaño</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo de apoyo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.socio_empresa}</p>
                    {c.descripcion && <p className="text-xs text-gray-400 truncate max-w-48">{c.descripcion}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAMANO_COLOR[c.tamano] ?? "bg-gray-100 text-gray-600"}`}>{c.tamano}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">{c.tipo_apoyo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${NIVEL_COLOR[c.nivel] ?? "bg-gray-100 text-gray-500"}`}>{c.nivel}</span>
                  </td>
                  <td className="px-4 py-3">
                    {puedeAdmin && (
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "crear" && <ModalClasificacion socios={socios} onClose={() => setModal(null)} onSaved={onSaved} />}
      {typeof modal === "number" && (() => {
        const c = items.find(x => x.id === modal);
        if (!c) return null;
        return (
          <ModalClasificacion
            inicial={{ id: c.id, socio_id: c.socio_id, tamano: c.tamano, tipo_apoyo: c.tipo_apoyo, nivel: c.nivel, descripcion: c.descripcion ?? "" }}
            socios={socios}
            onClose={() => setModal(null)}
            onSaved={onSaved}
          />
        );
      })()}
    </div>
  );
}
