"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Plus, MapPin, Clock, Calendar, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

interface Evento {
  id: number;
  fecha: string;
  descripcion: string | null;
  lugar: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  finalizado: boolean;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400";

function hhmm(t: string | null) { return t ? t.slice(0, 5) : ""; }

function formatFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function FormEvento({
  inicial,
  guardando,
  onGuardar,
  onCancelar,
}: {
  inicial?: Partial<Evento>;
  guardando: boolean;
  onGuardar: (data: { fecha: string; descripcion: string; lugar: string; hora_inicio: string; hora_fin: string }) => void;
  onCancelar: () => void;
}) {
  const [fecha,      setFecha]      = useState(inicial?.fecha       ?? "");
  const [desc,       setDesc]       = useState(inicial?.descripcion ?? "");
  const [lugar,      setLugar]      = useState(inicial?.lugar       ?? "");
  const [horaIni,    setHoraIni]    = useState(hhmm(inicial?.hora_inicio ?? null));
  const [horaFin,    setHoraFin]    = useState(hhmm(inicial?.hora_fin    ?? null));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm">{inicial?.id ? "Editar evento" : "Nuevo evento de Proyección Social"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha *</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Lugar</label>
          <input type="text" value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Ej: Parque central" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hora inicio</label>
          <input type="time" value={horaIni} onChange={e => setHoraIni(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Hora fin</label>
          <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            placeholder="Describe la actividad de proyección social..."
            className={inputCls + " resize-none"}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancelar} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button
          disabled={!fecha || guardando}
          onClick={() => onGuardar({ fecha, descripcion: desc, lugar, hora_inicio: horaIni, hora_fin: horaFin })}
          className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {guardando && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {inicial?.id ? "Guardar cambios" : "Crear evento"}
        </button>
      </div>
    </div>
  );
}

export default function ProyeccionSocialPage() {
  const [eventos,    setEventos]    = useState<Evento[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [creando,    setCreando]    = useState(false);
  const [editando,   setEditando]   = useState<Evento | null>(null);
  const [guardando,  setGuardando]  = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proyeccion-social");
      const data = await res.json();
      setEventos(Array.isArray(data) ? data : []);
    } catch {
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function crear(data: { fecha: string; descripcion: string; lugar: string; hora_inicio: string; hora_fin: string }) {
    setGuardando(true);
    try {
      await fetch("/api/proyeccion-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setCreando(false);
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function editar(id: number, data: { fecha: string; descripcion: string; lugar: string; hora_inicio: string; hora_fin: string }) {
    setGuardando(true);
    try {
      await fetch(`/api/proyeccion-social/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setEditando(null);
      cargar();
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    if (!confirm("¿Eliminar este evento?")) return;
    setEliminando(id);
    try {
      await fetch(`/api/proyeccion-social/${id}`, { method: "DELETE" });
      cargar();
    } finally {
      setEliminando(null);
    }
  }

  const proximos  = eventos.filter(e => !e.finalizado);
  const pasados   = eventos.filter(e => e.finalizado);

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-700" />
            Proyección Social
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Eventos de impacto comunitario — aparecen en Programación</p>
        </div>
        {!creando && !editando && (
          <button
            onClick={() => setCreando(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo evento
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Próximos</p>
          <p className="text-2xl font-bold text-red-700">{proximos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Realizados</p>
          <p className="text-2xl font-bold text-gray-600">{pasados.length}</p>
        </div>
      </div>

      {/* Formulario crear */}
      {creando && (
        <FormEvento
          guardando={guardando}
          onGuardar={crear}
          onCancelar={() => setCreando(false)}
        />
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : eventos.length === 0 && !creando ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-14 text-center">
          <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aún no hay eventos de proyección social.</p>
          <p className="text-xs text-gray-400 mt-1">Créalos aquí y aparecerán en el calendario de Programación.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proximos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">Próximos eventos</p>
              {proximos.map(e => (
                <EventoCard
                  key={e.id}
                  evento={e}
                  editando={editando?.id === e.id}
                  guardando={guardando}
                  eliminando={eliminando === e.id}
                  onEditar={() => setEditando(e)}
                  onEliminar={() => eliminar(e.id)}
                  onGuardar={data => editar(e.id, data)}
                  onCancelarEdicion={() => setEditando(null)}
                />
              ))}
            </div>
          )}
          {pasados.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mt-2">Realizados</p>
              {pasados.map(e => (
                <EventoCard
                  key={e.id}
                  evento={e}
                  editando={editando?.id === e.id}
                  guardando={guardando}
                  eliminando={eliminando === e.id}
                  onEditar={() => setEditando(e)}
                  onEliminar={() => eliminar(e.id)}
                  onGuardar={data => editar(e.id, data)}
                  onCancelarEdicion={() => setEditando(null)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventoCard({
  evento, editando, guardando, eliminando,
  onEditar, onEliminar, onGuardar, onCancelarEdicion,
}: {
  evento: Evento;
  editando: boolean;
  guardando: boolean;
  eliminando: boolean;
  onEditar: () => void;
  onEliminar: () => void;
  onGuardar: (data: { fecha: string; descripcion: string; lugar: string; hora_inicio: string; hora_fin: string }) => void;
  onCancelarEdicion: () => void;
}) {
  if (editando) {
    return (
      <FormEvento
        inicial={evento}
        guardando={guardando}
        onGuardar={onGuardar}
        onCancelar={onCancelarEdicion}
      />
    );
  }

  return (
    <div className={`bg-white rounded-xl border px-4 py-3 flex items-start gap-3 ${evento.finalizado ? "border-gray-100 opacity-70" : "border-gray-200"}`}>
      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${evento.finalizado ? "bg-gray-100" : "bg-red-50"}`}>
        {evento.finalizado
          ? <Check className="w-4 h-4 text-gray-400" />
          : <Heart className="w-4 h-4 text-red-600" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 capitalize">
          {evento.descripcion || "Evento de proyección social"}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />{formatFecha(evento.fecha)}
          </span>
          {(evento.hora_inicio || evento.hora_fin) && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {hhmm(evento.hora_inicio)}{evento.hora_fin ? ` – ${hhmm(evento.hora_fin)}` : ""}
            </span>
          )}
          {evento.lugar && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{evento.lugar}
            </span>
          )}
        </div>
      </div>

      {!evento.finalizado && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEditar}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onEliminar}
            disabled={eliminando}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar"
          >
            {eliminando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
