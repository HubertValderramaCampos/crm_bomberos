"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, X, Search, Trophy, Medal, Award, Building2, ChevronDown, ChevronUp, PackageOpen } from "lucide-react";

type Entidad = { id: number; nombre: string; tipo: string };

type DonacionItem = {
  descripcion: string; cantidad: string; unidad: string; categoria: string;
};

type Donacion = {
  id: number; fecha: string; tipo_donacion: string;
  entidad_id: number; entidad_nombre: string; entidad_tipo: string;
  observaciones: string | null;
  total_items: number;
  items: DonacionItem[];
};

type RankingItem = { entidad_nombre: string; entidad_id: number; total: number };

const CATEGORIAS = [
  "Material", "Equipamiento", "Alimentos", "Medicamentos",
  "Herramientas", "Vestimenta", "Servicios", "Combustible",
  "Insumos de limpieza", "Papelería", "Tecnología", "Otro",
];

const UNIDADES = ["unidad(es)", "kg", "litros", "cajas", "bolsas", "paquetes", "sets", "metros", "pares"];

const TIPOS_ENTIDAD = [
  "INSTITUCIÓN PÚBLICA", "EMPRESA PRIVADA", "ONG", "CGBVP",
  "MUNICIPALIDAD", "HOSPITAL", "COLEGIO", "IGLESIA", "OTRO",
];

const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

/* ── Selector de entidad ──────────────────────────────────────── */
function SelectorEntidad({ entidades, value, onChange }: {
  entidades: Entidad[]; value: number | null; onChange: (id: number) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto]   = useState(false);
  const seleccionada = entidades.find(e => e.id === value);
  const filtradas = entidades.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.tipo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="relative">
      <button type="button" onClick={() => setAbierto(p => !p)}
        className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-red-500 ${seleccionada ? "border-green-400 bg-green-50" : "border-gray-300 bg-white"}`}>
        {seleccionada
          ? <span className="font-medium text-gray-900">{seleccionada.nombre} <span className="ml-2 text-xs text-gray-400 font-normal">{seleccionada.tipo}</span></span>
          : <span className="text-gray-400">Buscar entidad...</span>}
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>
      {abierto && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input autoFocus value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar..." className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            {filtradas.length === 0
              ? <p className="text-xs text-gray-400 px-3 py-3 text-center">No encontrado</p>
              : filtradas.map(e => (
                <button key={e.id} type="button" onClick={() => { onChange(e.id); setAbierto(false); setBusqueda(""); }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{e.nombre}</span>
                  <span className="text-xs text-gray-400 ml-2 shrink-0">{e.tipo}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Nueva entidad inline ─────────────────────────────────────── */
function FormNuevaEntidad({ onCreada, onCancel }: { onCreada: (e: Entidad) => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState("");
  const [tipo,   setTipo]   = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!nombre.trim() || !tipo) return;
    setGuardando(true); setError("");
    const res = await fetch("/api/entidades", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nombre.trim(), tipo }) });
    if (!res.ok) { setError("Error al crear."); setGuardando(false); return; }
    const nueva = await res.json();
    onCreada({ id: nueva.id, nombre: nombre.trim(), tipo });
    setGuardando(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-blue-200 bg-blue-50 rounded-xl p-4">
      <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Nueva entidad</p>
      <input value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Nombre de la entidad" className={cls} />
      <select value={tipo} onChange={e => setTipo(e.target.value)} required className={cls}>
        <option value="">Tipo...</option>
        {TIPOS_ENTIDAD.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={guardando} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-xs font-medium hover:bg-blue-700 disabled:opacity-50">{guardando ? "Creando..." : "Crear"}</button>
        <button type="button" onClick={onCancel} className="px-3 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
      </div>
    </form>
  );
}

/* ── Tabla editable de ítems ──────────────────────────────────── */
function TablaItems({ items, onChange }: {
  items: DonacionItem[];
  onChange: (items: DonacionItem[]) => void;
}) {
  function agregar() {
    onChange([...items, { descripcion: "", cantidad: "", unidad: "", categoria: "" }]);
  }

  function actualizar(idx: number, campo: keyof DonacionItem, valor: string) {
    const nuevos = items.map((it, i) => i === idx ? { ...it, [campo]: valor } : it);
    onChange(nuevos);
  }

  function eliminar(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      {/* Cabecera */}
      {items.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_100px_110px_28px] gap-1.5 px-1">
          {["Bien / Servicio", "Cant.", "Unidad", "Categoría", ""].map(h => (
            <p key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{h}</p>
          ))}
        </div>
      )}

      {/* Filas */}
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_80px_100px_110px_28px] gap-1.5 items-center">
          <input
            type="text"
            value={item.descripcion}
            onChange={e => actualizar(idx, "descripcion", e.target.value)}
            placeholder="Ej: Extintores PQS 6kg"
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 w-full"
          />
          <input
            type="text"
            value={item.cantidad}
            onChange={e => actualizar(idx, "cantidad", e.target.value)}
            placeholder="0"
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 text-center w-full"
          />
          <select value={item.unidad} onChange={e => actualizar(idx, "unidad", e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 w-full">
            <option value="">—</option>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={item.categoria} onChange={e => actualizar(idx, "categoria", e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 w-full">
            <option value="">—</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="button" onClick={() => eliminar(idx)}
            className="flex items-center justify-center w-7 h-7 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button type="button" onClick={agregar}
        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium transition-colors mt-1">
        <Plus className="w-4 h-4" /> Agregar ítem
      </button>
    </div>
  );
}

/* ── Formulario de donación ───────────────────────────────────── */
function FormDonacion({ initial, entidades: entidadesIniciales, onSave, onCancel, loading }: {
  initial?: Donacion; entidades: Entidad[];
  onSave: (d: { fecha: string; tipo_donacion: string; entidad_id: number; observaciones: string; items: DonacionItem[] }) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [fecha,        setFecha]        = useState(initial?.fecha?.slice(0, 10) ?? "");
  const [tipo,         setTipo]         = useState(initial?.tipo_donacion ?? "");
  const [entidadId,    setEntidadId]    = useState<number | null>(initial?.entidad_id ?? null);
  const [observaciones,setObservaciones]= useState(initial?.observaciones ?? "");
  const [items,        setItems]        = useState<DonacionItem[]>(initial?.items ?? [{ descripcion: "", cantidad: "", unidad: "", categoria: "" }]);
  const [entidades,    setEntidades]    = useState<Entidad[]>(entidadesIniciales);
  const [creandoEnt,   setCreandoEnt]   = useState(false);

  function handleEntidadCreada(nueva: Entidad) {
    setEntidades(prev => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setEntidadId(nueva.id);
    setCreandoEnt(false);
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!fecha || !tipo || !entidadId) return;
    const itemsValidos = items.filter(i => i.descripcion.trim());
    onSave({ fecha, tipo_donacion: tipo, entidad_id: entidadId, observaciones, items: itemsValidos });
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
          {!creandoEnt && (
            <button type="button" onClick={() => setCreandoEnt(true)} className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Nueva entidad
            </button>
          )}
        </div>
        {creandoEnt
          ? <FormNuevaEntidad onCreada={handleEntidadCreada} onCancel={() => setCreandoEnt(false)} />
          : <SelectorEntidad entidades={entidades} value={entidadId} onChange={setEntidadId} />}
      </div>

      {/* Categoría general */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Categoría general *</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} required className={cls}>
          <option value="">Seleccionar...</option>
          {CATEGORIAS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Ítems */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Ítems donados *
          <span className="text-gray-400 font-normal ml-1">— agrega uno o varios productos/servicios</span>
        </label>
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <TablaItems items={items} onChange={setItems} />
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones generales</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={2}
          placeholder="Estado de los bienes, condiciones, notas adicionales..."
          className={cls + " resize-none"} />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading || !entidadId || !tipo}
          className="flex-1 bg-red-700 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-800 disabled:opacity-50">
          {loading ? "Guardando..." : "Guardar donación"}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ── Ranking ──────────────────────────────────────────────────── */
function RankingEntidades({ donaciones }: { donaciones: Donacion[] }) {
  const ranking: RankingItem[] = Object.values(
    donaciones.reduce((acc: Record<number, RankingItem>, d) => {
      if (!acc[d.entidad_id]) acc[d.entidad_id] = { entidad_nombre: d.entidad_nombre, entidad_id: d.entidad_id, total: 0 };
      acc[d.entidad_id].total++;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 10);

  const iconos = [
    <Trophy key="1" className="w-5 h-5 text-yellow-500" />,
    <Medal  key="2" className="w-5 h-5 text-gray-400"   />,
    <Award  key="3" className="w-5 h-5 text-amber-600"  />,
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">Ranking de donantes</h3>
      {ranking.length === 0
        ? <p className="text-sm text-gray-400 text-center py-6">Sin datos aún.</p>
        : <div className="space-y-2">
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
      }
    </div>
  );
}

/* ── Fila expandible ──────────────────────────────────────────── */
function FilaDonacion({ d, esAdmin, onEditar, onEliminar }: {
  d: Donacion; esAdmin: boolean;
  onEditar: () => void; onEliminar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  function fmt(s: string) { return new Date(s).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }); }

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setAbierto(p => !p)}>
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(d.fecha)}</td>
        <td className="px-4 py-3 max-w-[160px]">
          <p className="font-medium text-gray-900 truncate">{d.entidad_nombre}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{d.entidad_tipo}</p>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700 font-medium">{d.total_items} ítem{d.total_items !== 1 ? "s" : ""}</span>
            {d.items[0]?.descripcion && (
              <span className="text-xs text-gray-400 truncate max-w-[120px]">{d.items[0].descripcion}{d.total_items > 1 ? ` +${d.total_items - 1}` : ""}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-xs whitespace-nowrap">
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{d.tipo_donacion}</span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => setAbierto(p => !p)} className="p-1 text-gray-400 hover:text-gray-700 rounded">
              {abierto ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {esAdmin && (
              <>
                <button onClick={onEditar} className="p-1 text-gray-400 hover:text-blue-600 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={onEliminar} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Detalle de ítems expandible */}
      {abierto && (
        <tr>
          <td colSpan={5} className="px-4 pb-3 pt-0 bg-gray-50">
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-semibold text-gray-500">Bien / Servicio</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500 w-20">Cantidad</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500 w-24">Unidad</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-500 w-28">Categoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {d.items.length === 0
                    ? <tr><td colSpan={4} className="px-3 py-3 text-gray-400 text-center">Sin ítems registrados</td></tr>
                    : d.items.map((item, i) => (
                      <tr key={i} className="bg-white">
                        <td className="px-3 py-2 font-medium text-gray-900">{item.descripcion}</td>
                        <td className="px-3 py-2 text-gray-600">{item.cantidad || "—"}</td>
                        <td className="px-3 py-2 text-gray-600">{item.unidad || "—"}</td>
                        <td className="px-3 py-2">
                          {item.categoria
                            ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{item.categoria}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              {d.observaciones && (
                <div className="px-3 py-2 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
                  <span className="font-semibold">Observaciones:</span> {d.observaciones}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Componente principal ─────────────────────────────────────── */
export function DonacionesGestion({ esAdmin }: { esAdmin: boolean }) {
  const [donaciones, setDonaciones] = useState<Donacion[]>([]);
  const [entidades,  setEntidades]  = useState<Entidad[]>([]);
  const [busqueda,   setBusqueda]   = useState("");
  const [showModal,  setShowModal]  = useState(false);
  const [editando,   setEditando]   = useState<Donacion | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [cargando,   setCargando]   = useState(true);

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
    d.tipo_donacion.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.items.some(i => i.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
  );

  async function guardar(data: { fecha: string; tipo_donacion: string; entidad_id: number; observaciones: string; items: DonacionItem[] }) {
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

  const porTipo = donaciones.reduce((acc: Record<string, number>, d) => {
    acc[d.tipo_donacion] = (acc[d.tipo_donacion] ?? 0) + 1; return acc;
  }, {});
  const tipoTop = Object.entries(porTipo).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  const anio = new Date().getFullYear().toString();

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total donaciones",  value: donaciones.length,                                                       color: "text-gray-900"  },
          { label: "Donantes únicos",   value: new Set(donaciones.map(d => d.entidad_id)).size,                         color: "text-blue-700"  },
          { label: "Tipo más frecuente",value: tipoTop,                                                                  color: "text-green-700" },
          { label: "Este año",          value: donaciones.filter(d => d.fecha?.startsWith(anio)).length,                 color: "text-red-700"   },
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
                placeholder="Buscar entidad, tipo o ítem..."
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
                    {["Fecha", "Entidad", "Ítems donados", "Categoría", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtradas.map(d => (
                    <FilaDonacion key={d.id} d={d} esAdmin={esAdmin}
                      onEditar={() => { setEditando(d); setShowModal(true); }}
                      onEliminar={() => eliminar(d.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <RankingEntidades donaciones={donaciones} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">{editando ? "Editar donación" : "Nueva donación"}</h3>
              <button onClick={() => { setShowModal(false); setEditando(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              <FormDonacion
                initial={editando ?? undefined}
                entidades={entidades}
                onSave={guardar}
                onCancel={() => { setShowModal(false); setEditando(null); }}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
