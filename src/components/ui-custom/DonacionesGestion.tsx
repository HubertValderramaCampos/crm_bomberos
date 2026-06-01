"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Search, Trophy, Medal, Award, Building2, ChevronDown } from "lucide-react";

type Entidad = { id: number; nombre: string; tipo: string };
type Donacion = {
  id: number; fecha: string; tipo_donacion: string;
  entidad_id: number; entidad_nombre: string; entidad_tipo: string;
  descripcion: string | null; cantidad: string | null;
  unidad: string | null; observaciones: string | null;
};
type RankingItem = { entidad_nombre: string; entidad_id: number; total: number };

const TIPOS = [
  "Material", "Equipamiento", "Alimentos", "Medicamentos",
  "Herramientas", "Vestimenta", "Servicios", "Combustible",
  "Insumos de limpieza", "Papelería", "Tecnología", "Otro",
];

const UNIDADES = ["unidad(es)", "kg", "litros", "cajas", "bolsas", "paquetes", "sets", "metros", "pares"];

const TIPOS_ENTIDAD = [
  "INSTITUCIÓN PÚBLICA", "EMPRESA PRIVADA", "ONG", "CGBVP",
  "MUNICIPALIDAD", "HOSPITAL", "COLEGIO", "IGLESIA", "OTRO",
];

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SelectorEntidad({
  entidades, value, onChange,
}: {
  entidades: Entidad[]; value: number | null; onChange: (id: number) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);

  const seleccionada = entidades.find(e => e.id === value);
  const filtradas = entidades.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.tipo.toLowerCase().includes(busqueda.toLowerCase())
  );

  function seleccionar(e: Entidad) {
    onChange(e.id);
    setBusqueda("");
    setAbierto(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto(p => !p)}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-red-500 ${
          seleccionada ? "border-green-400 bg-green-50" : "border-gray-300 bg-white"
        }`}
      >
        {seleccionada ? (
          <span className="font-medium text-gray-900">{seleccionada.nombre}
            <span className="ml-2 text-xs text-gray-400 font-normal">{seleccionada.tipo}</span>
          </span>
        ) : (
          <span className="text-gray-400">Buscar entidad existente...</span>
        )}
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {abierto && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                autoFocus
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o tipo..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtradas.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-3 text-center">No se encontraron entidades</p>
            ) : (
              filtradas.map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => seleccionar(e)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-900">{e.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2 shrink-0">{e.tipo}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FormNuevaEntidad({ onCreada, onCancel }: { onCreada: (e: Entidad) => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!nombre.trim() || !tipo) return;
    setGuardando(true);
    setError("");
    const res = await fetch("/api/entidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombre.trim(), tipo }),
    });
    if (!res.ok) { setError("Error al crear la entidad."); setGuardando(false); return; }
    const nueva = await res.json();
    onCreada({ id: nueva.id, nombre: nombre.trim(), tipo });
    setGuardando(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-blue-200 bg-blue-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5" /> Crear nueva entidad
      </p>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
        <input value={nombre} onChange={e => setNombre(e.target.value)} required
          placeholder="Ej: Municipalidad de Puente Piedra"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo *</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Seleccionar tipo...</option>
          {TIPOS_ENTIDAD.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={guardando}
          className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
          {guardando ? "Creando..." : "Crear entidad"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-3 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function FormDonacion({
  initial, entidades: entidadesIniciales, onSave, onCancel, loading,
}: {
  initial?: Donacion; entidades: Entidad[];
  onSave: (d: { fecha: string; tipo_donacion: string; entidad_id: number; descripcion: string; cantidad: string; unidad: string; observaciones: string }) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [fecha,        setFecha]        = useState(initial?.fecha?.slice(0, 10) ?? "");
  const [tipo,         setTipo]         = useState(initial?.tipo_donacion ?? "");
  const [entidadId,    setEntidadId]    = useState<number | null>(initial?.entidad_id ?? null);
  const [descripcion,  setDescripcion]  = useState(initial?.descripcion ?? "");
  const [cantidad,     setCantidad]     = useState(initial?.cantidad ?? "");
  const [unidad,       setUnidad]       = useState(initial?.unidad ?? "");
  const [observaciones,setObservaciones]= useState(initial?.observaciones ?? "");
  const [entidades,    setEntidades]    = useState<Entidad[]>(entidadesIniciales);
  const [creandoEntidad, setCreandoEntidad] = useState(false);

  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500";

  function handleEntidadCreada(nueva: Entidad) {
    setEntidades(prev => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setEntidadId(nueva.id);
    setCreandoEntidad(false);
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!fecha || !tipo || !entidadId || !descripcion.trim()) return;
    onSave({ fecha, tipo_donacion: tipo, entidad_id: entidadId, descripcion, cantidad, unidad, observaciones });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Fecha */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Fecha *</label>
        <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required className={cls} />
      </div>

      {/* Entidad */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-gray-700">Entidad donante *</label>
          {!creandoEntidad && (
            <button type="button" onClick={() => setCreandoEntidad(true)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Nueva entidad
            </button>
          )}
        </div>
        {creandoEntidad
          ? <FormNuevaEntidad onCreada={handleEntidadCreada} onCancel={() => setCreandoEntidad(false)} />
          : <SelectorEntidad entidades={entidades} value={entidadId} onChange={setEntidadId} />}
        {!entidadId && !creandoEntidad && (
          <p className="text-xs text-amber-600 mt-1">Si la entidad no existe, créala con "Nueva entidad".</p>
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Categoría *</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} required className={cls}>
          <option value="">Seleccionar categoría...</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nombre / Descripción del bien o servicio *</label>
        <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} required
          placeholder="Ej: Extintores PQS 6kg, Camillas plegables, Servicio de impresión..."
          className={cls} />
      </div>

      {/* Cantidad + Unidad */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad</label>
          <input type="text" value={cantidad} onChange={e => setCantidad(e.target.value)}
            placeholder="Ej: 10, 2.5, 1" className={cls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Unidad</label>
          <select value={unidad} onChange={e => setUnidad(e.target.value)} className={cls}>
            <option value="">Seleccionar...</option>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2}
          placeholder="Estado del bien, condiciones especiales, etc."
          className={cls + " resize-none"} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading || !entidadId || !descripcion.trim()}
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
    donaciones.reduce((acc: Record<number, RankingItem>, d) => {
      if (!acc[d.entidad_id]) acc[d.entidad_id] = { entidad_nombre: d.entidad_nombre, entidad_id: d.entidad_id, total: 0 };
      acc[d.entidad_id].total++;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 10);

  if (ranking.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">Ranking de donantes</h3>
      <p className="text-sm text-gray-400 text-center py-6">Sin datos aún.</p>
    </div>
  );

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
          <div key={r.entidad_id} className="flex items-center gap-3">
            <div className="w-7 flex justify-center shrink-0">
              {i < 3 ? iconos[i] : <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-900 truncate">{r.entidad_nombre}</p>
            <span className="text-sm font-bold text-gray-900 shrink-0">{r.total}</span>
            <div className="w-20 bg-gray-100 rounded-full h-1.5 shrink-0">
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
    d.entidad_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.tipo_donacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  async function guardar(data: { fecha: string; tipo_donacion: string; entidad_id: number; descripcion: string; cantidad: string; unidad: string; observaciones: string }) {
    setLoading(true);
    try {
      if (editando) {
        await fetch(`/api/donaciones/${editando.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        });
      } else {
        await fetch("/api/donaciones", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
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

  const porTipo = donaciones.reduce((acc: Record<string, number>, d) => {
    acc[d.tipo_donacion] = (acc[d.tipo_donacion] ?? 0) + 1;
    return acc;
  }, {});
  const tipoTop = Object.entries(porTipo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const anioActual = new Date().getFullYear().toString();

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total donaciones", value: donaciones.length, color: "text-gray-900" },
          { label: "Donantes únicos", value: new Set(donaciones.map(d => d.entidad_id)).size, color: "text-blue-700" },
          { label: "Tipo más frecuente", value: tipoTop, color: "text-green-700" },
          { label: "Este año", value: donaciones.filter(d => d.fecha?.startsWith(anioActual)).length, color: "text-red-700" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Tabla */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar entidad o tipo..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
            {esAdmin && (
              <button onClick={() => { setEditando(null); setShowModal(true); }}
                className="flex items-center gap-1.5 bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-800 ml-3 shrink-0">
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
                    {["Fecha", "Entidad", "Bien / Servicio", "Cant.", "Categoría", ...(esAdmin ? [""] : [])].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtradas.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(d.fecha)}</td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="font-medium text-gray-900 truncate">{d.entidad_nombre}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{d.entidad_tipo}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm text-gray-900 truncate">{d.descripcion ?? <span className="text-gray-300">—</span>}</p>
                        {d.observaciones && <p className="text-[10px] text-gray-400 truncate mt-0.5">{d.observaciones}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                        {d.cantidad ? `${d.cantidad}${d.unidad ? ` ${d.unidad}` : ""}` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
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
        <Modal
          titulo={editando ? "Editar donación" : "Nueva donación"}
          onClose={() => { setShowModal(false); setEditando(null); }}
        >
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
