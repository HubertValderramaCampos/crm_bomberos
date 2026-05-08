"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Check, Search, Trophy, Medal, Award } from "lucide-react";

type Entidad = { id: number; nombre: string; tipo: string };
type Donacion = {
  id: number; fecha: string; entidad: string; tipo_donacion: string;
  entidad_id: number | null; entidad_nombre: string | null;
};
type RankingItem = { entidad: string; entidad_id: number | null; total: number };

const TIPOS = [
  "Económica", "Material", "Equipamiento", "Alimentos", "Medicamentos",
  "Herramientas", "Vestimenta", "Servicios", "Otro"
];

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormDonacion({
  initial, entidades, onSave, onCancel, loading
}: {
  initial?: Partial<Donacion>; entidades: Entidad[];
  onSave: (d: Omit<Donacion, "id" | "entidad_nombre">) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [fecha, setFecha] = useState(initial?.fecha?.slice(0, 10) ?? "");
  const [entidad, setEntidad] = useState(initial?.entidad ?? "");
  const [entidad_id, setEntidadId] = useState<number | null>(initial?.entidad_id ?? null);
  const [tipo, setTipo] = useState(initial?.tipo_donacion ?? "");
  const [busqueda, setBusqueda] = useState("");

  const entidadesFiltradas = entidades.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  function seleccionarEntidad(e: Entidad) {
    setEntidad(e.nombre);
    setEntidadId(e.id);
    setBusqueda("");
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!fecha || !entidad || !tipo) return;
    onSave({ fecha, entidad, tipo_donacion: tipo, entidad_id });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Entidad donante *</label>
        <div className="relative">
          <input value={busqueda || entidad} onChange={e => { setBusqueda(e.target.value); setEntidad(e.target.value); setEntidadId(null); }}
            placeholder="Buscar entidad registrada o escribir..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
          {busqueda && entidadesFiltradas.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {entidadesFiltradas.slice(0, 8).map(e => (
                <button key={e.id} type="button" onClick={() => seleccionarEntidad(e)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">
                  <span className="font-medium">{e.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2">{e.tipo}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {entidad_id && (
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Check className="w-3 h-3" /> Vinculado a entidad registrada
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de donación *</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          <option value="">Seleccionar tipo...</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading}
          className="flex-1 bg-red-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-800 disabled:opacity-50">
          {loading ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function RankingEntidades({ donaciones }: { donaciones: Donacion[] }) {
  const ranking: RankingItem[] = Object.values(
    donaciones.reduce((acc: Record<string, RankingItem>, d) => {
      const key = d.entidad_id ? `id_${d.entidad_id}` : `txt_${d.entidad}`;
      if (!acc[key]) acc[key] = { entidad: d.entidad_nombre ?? d.entidad, entidad_id: d.entidad_id, total: 0 };
      acc[key].total++;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 10);

  if (ranking.length === 0) return null;

  const iconos = [
    <Trophy key="1" className="w-5 h-5 text-yellow-500" />,
    <Medal key="2" className="w-5 h-5 text-gray-400" />,
    <Award key="3" className="w-5 h-5 text-amber-600" />,
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">Ranking de donantes</h3>
      <div className="space-y-2">
        {ranking.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-7 flex justify-center shrink-0">
              {i < 3 ? iconos[i] : (
                <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{r.entidad}</p>
            </div>
            <div className="shrink-0 flex items-center gap-1">
              <span className="text-sm font-bold text-gray-900">{r.total}</span>
              <span className="text-xs text-gray-400">{r.total === 1 ? "donación" : "donaciones"}</span>
            </div>
            <div className="w-24 bg-gray-100 rounded-full h-1.5 shrink-0">
              <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${(r.total / ranking[0].total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonacionesGestion({ esAdmin }: { esAdmin: boolean }) {
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Donacion | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const [dRes, eRes] = await Promise.all([
      fetch("/api/donaciones").then(r => r.json()),
      fetch("/api/entidades").then(r => r.json()),
    ]);
    setDonaciones(Array.isArray(dRes) ? dRes : []);
    setEntidades(Array.isArray(eRes) ? eRes : []);
    setCargando(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = donaciones.filter(d =>
    d.entidad.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.tipo_donacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  async function guardar(data: Omit<Donacion, "id" | "entidad_nombre">) {
    setLoading(true);
    try {
      if (editando) {
        await fetch(`/api/donaciones/${editando.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
        });
      } else {
        await fetch("/api/donaciones", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
        });
      }
      setShowModal(false); setEditando(null);
      await cargar();
    } finally { setLoading(false); }
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar esta donación?")) return;
    await fetch(`/api/donaciones/${id}`, { method: "DELETE" });
    await cargar();
  }

  function fmt(d: string) {
    return new Date(d).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  }

  const total = donaciones.length;
  const porTipo = donaciones.reduce((acc: Record<string, number>, d) => {
    acc[d.tipo_donacion] = (acc[d.tipo_donacion] ?? 0) + 1;
    return acc;
  }, {});
  const tipoTop = Object.entries(porTipo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total donaciones", value: total, color: "text-gray-900" },
          { label: "Donantes únicos", value: new Set(donaciones.map(d => d.entidad_id ?? d.entidad)).size, color: "text-blue-700" },
          { label: "Tipo más frecuente", value: tipoTop, color: "text-green-700" },
          { label: "Este año", value: donaciones.filter(d => d.fecha?.startsWith("2026")).length, color: "text-red-700" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tabla principal */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            {esAdmin && (
              <button onClick={() => { setEditando(null); setShowModal(true); }}
                className="flex items-center gap-1.5 bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-800 ml-3">
                <Plus className="w-4 h-4" /> Nueva
              </button>
            )}
          </div>

          {cargando ? (
            <p className="text-center py-12 text-sm text-gray-400">Cargando...</p>
          ) : filtradas.length === 0 ? (
            <p className="text-center py-12 text-sm text-gray-400">Sin registros.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Fecha", "Entidad", "Tipo", ...(esAdmin ? [""] : [])].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtradas.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(d.fecha)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px]">
                        <p className="truncate">{d.entidad_nombre ?? d.entidad}</p>
                        {d.entidad_id && <p className="text-[10px] text-green-600 mt-0.5">Entidad registrada</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{d.tipo_donacion}</span>
                      </td>
                      {esAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditando(d); setShowModal(true); }}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => eliminar(d.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ranking */}
        <RankingEntidades donaciones={donaciones} />
      </div>

      {showModal && (
        <Modal titulo={editando ? "Editar donación" : "Nueva donación"} onClose={() => { setShowModal(false); setEditando(null); }}>
          <FormDonacion
            initial={editando ?? undefined}
            entidades={entidades}
            onSave={guardar}
            onCancel={() => { setShowModal(false); setEditando(null); }}
            loading={loading}
          />
        </Modal>
      )}
    </div>
  );
}
