"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Clock, Plus, Trash2, Pencil, X, Loader2, Save } from "lucide-react";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIA_COLOR = ["bg-gray-100 text-gray-600", "bg-blue-100 text-blue-700", "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700", "bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-gray-100 text-gray-600"];

interface Horario {
  id: number; dia_semana: number; hora_inicio: string; hora_fin: string;
  descripcion: string | null; activo: boolean;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

export default function HorariosPage() {
  const { data: session } = useSession();
  const puedeEditar = ["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"].includes(session?.user?.rol ?? "");

  const [horarios,   setHorarios]  = useState<Horario[]>([]);
  const [loading,    setLoading]   = useState(true);
  const [modal,      setModal]     = useState(false);
  const [editando,   setEditando]  = useState<Horario | null>(null);
  const [guardando,  setGuardando] = useState(false);

  const [form, setForm] = useState({ dia_semana: 1, hora_inicio: "08:00", hora_fin: "12:00", descripcion: "" });

  const cargar = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/formativa/horarios").then(r => r.json());
    setHorarios(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  function abrirCrear() {
    setEditando(null);
    setForm({ dia_semana: 1, hora_inicio: "08:00", hora_fin: "12:00", descripcion: "" });
    setModal(true);
  }

  function abrirEditar(h: Horario) {
    setEditando(h);
    setForm({ dia_semana: h.dia_semana, hora_inicio: h.hora_inicio.slice(0,5), hora_fin: h.hora_fin.slice(0,5), descripcion: h.descripcion ?? "" });
    setModal(true);
  }

  async function guardar() {
    setGuardando(true);
    try {
      if (editando) {
        await fetch(`/api/formativa/horarios/${editando.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, activo: editando.activo }),
        });
      } else {
        await fetch("/api/formativa/horarios", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      setModal(false); cargar();
    } finally { setGuardando(false); }
  }

  async function toggleActivo(h: Horario) {
    await fetch(`/api/formativa/horarios/${h.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...h, activo: !h.activo }),
    });
    cargar();
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este horario?")) return;
    await fetch(`/api/formativa/horarios/${id}`, { method: "DELETE" });
    cargar();
  }

  // Agrupar por día
  const porDia = DIAS.map((dia, idx) => ({
    dia, idx,
    horarios: horarios.filter(h => h.dia_semana === idx),
  })).filter(d => d.horarios.length > 0 || puedeEditar);

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-700" />
            Horarios formativos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Días y horarios de asistencia obligatoria para aspirantes y postulantes</p>
        </div>
        {puedeEditar && (
          <button onClick={abrirCrear}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 transition-colors">
            <Plus className="w-4 h-4" /> Agregar horario
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
      ) : horarios.length === 0 && !puedeEditar ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aún no hay horarios configurados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6,0].map(diaIdx => {
            const horariosDelDia = horarios.filter(h => h.dia_semana === diaIdx);
            if (horariosDelDia.length === 0) return null;
            return (
              <div key={diaIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DIA_COLOR[diaIdx]}`}>
                    {DIAS[diaIdx]}
                  </span>
                  {puedeEditar && (
                    <button onClick={abrirCrear} className="text-xs text-gray-400 hover:text-red-600 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="divide-y divide-gray-50">
                  {horariosDelDia.map(h => (
                    <div key={h.id} className={`px-4 py-3 flex items-center gap-3 ${!h.activo ? "opacity-50" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{h.hora_inicio.slice(0,5)} — {h.hora_fin.slice(0,5)}</p>
                        {h.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate">{h.descripcion}</p>}
                        {!h.activo && <span className="text-[10px] text-gray-400 italic">Inactivo</span>}
                      </div>
                      {puedeEditar && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => toggleActivo(h)} title={h.activo ? "Desactivar" : "Activar"}
                            className={`w-8 h-4 rounded-full transition-colors relative ${h.activo ? "bg-green-500" : "bg-gray-300"}`}>
                            <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${h.activo ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                          <button onClick={() => abrirEditar(h)} className="p-1 text-gray-400 hover:text-blue-600 rounded">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => eliminar(h.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resumen visual semana */}
      {horarios.filter(h => h.activo).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Vista semanal</p>
          <div className="grid grid-cols-7 gap-1">
            {[1,2,3,4,5,6,0].map(diaIdx => {
              const tiene = horarios.some(h => h.dia_semana === diaIdx && h.activo);
              return (
                <div key={diaIdx} className={`rounded-lg py-2 text-center text-xs font-bold ${tiene ? "bg-red-700 text-white" : "bg-gray-100 text-gray-400"}`}>
                  {DIAS_CORTO[diaIdx]}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">{editando ? "Editar horario" : "Nuevo horario"}</h2>
              <button onClick={() => setModal(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Día de la semana</label>
                <select value={form.dia_semana} onChange={e => setForm(f => ({ ...f, dia_semana: Number(e.target.value) }))} className={inputCls}>
                  {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora inicio</label>
                  <input type="time" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora fin</label>
                  <input type="time" value={form.hora_fin} onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Descripción (opcional)</label>
                <input type="text" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Instrucción teórica" className={inputCls} />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={guardar} disabled={guardando}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2">
                {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
