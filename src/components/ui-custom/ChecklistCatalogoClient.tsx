"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Settings, Loader2, Plus, EyeOff, Eye, Truck } from "lucide-react";

interface Vehiculo { id: number; codigo: string; tipo: string }
interface Item {
  id: number; seccion: string; orden: number; articulo: string;
  cantidad: number | null; activo: boolean;
}

export function ChecklistCatalogoClient() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[] | null>(null);
  const [vehiculoId, setVehiculoId] = useState<number | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [nuevo, setNuevo] = useState({ seccion: "", articulo: "", cantidad: "" });
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch("/api/checklist/vehiculos")
      .then(r => r.json())
      .then((data: Vehiculo[]) => {
        setVehiculos(data);
        if (data.length > 0) setVehiculoId(data[0].id);
      })
      .catch(() => setVehiculos([]));
  }, []);

  function cargarItems(vId: number) {
    fetch(`/api/checklist/catalogo?vehiculoId=${vId}`)
      .then(r => r.json())
      .then((data: Item[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }

  useEffect(() => { if (vehiculoId) cargarItems(vehiculoId); }, [vehiculoId]);

  async function actualizarItem(id: number, cambios: Partial<Item>) {
    setItems(prev => prev ? prev.map(it => it.id === id ? { ...it, ...cambios } : it) : prev);
    await fetch(`/api/checklist/catalogo/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios),
    }).catch(() => {});
  }

  async function agregarItem() {
    if (!vehiculoId || !nuevo.seccion.trim() || !nuevo.articulo.trim()) return;
    setGuardando(true);
    const res = await fetch("/api/checklist/catalogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehiculoId,
        seccion: nuevo.seccion.trim(),
        articulo: nuevo.articulo.trim(),
        cantidad: nuevo.cantidad || null,
      }),
    });
    setGuardando(false);
    if (res.ok) {
      setNuevo({ seccion: "", articulo: "", cantidad: "" });
      cargarItems(vehiculoId);
    }
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/checklist" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Checklist de Unidades
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-red-700" />
          Catálogo de Checklist
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Agregar, editar o desactivar ítems por unidad</p>
      </div>

      {vehiculos === null ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {vehiculos.map(v => (
              <button
                key={v.id}
                onClick={() => setVehiculoId(v.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  vehiculoId === v.id
                    ? "bg-red-700 text-white border-red-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Truck className="w-4 h-4" /> {v.codigo}
              </button>
            ))}
          </div>

          {/* Agregar ítem */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Agregar ítem</p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_100px_auto] gap-2">
              <input
                value={nuevo.seccion}
                onChange={e => setNuevo({ ...nuevo, seccion: e.target.value })}
                placeholder="Sección (ej. RACK N° 01)"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <input
                value={nuevo.articulo}
                onChange={e => setNuevo({ ...nuevo, articulo: e.target.value })}
                placeholder="Artículo"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <input
                value={nuevo.cantidad}
                onChange={e => setNuevo({ ...nuevo, cantidad: e.target.value.replace(/\D/g, "") })}
                placeholder="Cant."
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                onClick={agregarItem}
                disabled={guardando || !nuevo.seccion.trim() || !nuevo.articulo.trim()}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {items === null ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Cargando...</div>
            ) : items.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Sin ítems para esta unidad.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map(it => (
                  <div key={it.id} className={`flex items-center gap-3 px-5 py-2.5 ${!it.activo ? "opacity-40" : ""}`}>
                    <input
                      defaultValue={it.seccion}
                      onBlur={e => e.target.value !== it.seccion && actualizarItem(it.id, { seccion: e.target.value })}
                      className="w-40 shrink-0 border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 text-xs text-gray-500 focus:outline-none"
                    />
                    <input
                      defaultValue={it.articulo}
                      onBlur={e => e.target.value !== it.articulo && actualizarItem(it.id, { articulo: e.target.value })}
                      className="flex-1 min-w-0 border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none"
                    />
                    <input
                      defaultValue={it.cantidad ?? ""}
                      onBlur={e => Number(e.target.value || 0) !== (it.cantidad ?? 0) && actualizarItem(it.id, { cantidad: e.target.value === "" ? null : Number(e.target.value) })}
                      className="w-16 shrink-0 border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 text-xs text-gray-500 text-center focus:outline-none"
                    />
                    <button
                      onClick={() => actualizarItem(it.id, { activo: !it.activo })}
                      className="shrink-0 text-gray-300 hover:text-gray-600 p-1"
                      title={it.activo ? "Desactivar" : "Activar"}
                    >
                      {it.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
