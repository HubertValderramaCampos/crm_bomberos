"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ListChecks, Plus, Loader2, ChevronRight, Users, X, Calendar, MapPin,
} from "lucide-react";
import { TIPOS_PRACTICA } from "@/lib/evaluacionPracticaCatalogo";

interface EvaluacionRow {
  id: number; fecha: string; hora: string | null; lugar: string | null;
  tipo_practica: string; created_at: string;
  creado_por_codigo: string; apellidos: string | null; nombres: string | null;
  si_count: number; total_items: number;
}

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtFecha(iso: string) {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function EvaluacionPracticaClient() {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionRow[] | null>(null);
  const [permiso, setPermiso] = useState<{ puedeEditar: boolean; esJefe: boolean } | null>(null);
  const [modal, setModal] = useState(false);
  const [fecha, setFecha] = useState(hoyLocal());
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [tipoPractica, setTipoPractica] = useState<string>(TIPOS_PRACTICA[0]);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    fetch("/api/evaluacion-practica")
      .then(r => r.json())
      .then((data: EvaluacionRow[]) => setEvaluaciones(Array.isArray(data) ? data : []))
      .catch(() => setEvaluaciones([]));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    fetch("/api/evaluacion-practica/permiso")
      .then(r => r.json())
      .then(d => setPermiso({ puedeEditar: !!d.puedeEditar, esJefe: !!d.esJefe }))
      .catch(() => setPermiso({ puedeEditar: false, esJefe: false }));
  }, []);

  function abrirModal() {
    setFecha(hoyLocal()); setHora(""); setLugar(""); setTipoPractica(TIPOS_PRACTICA[0]); setError("");
    setModal(true);
  }

  async function crear() {
    setCreando(true); setError("");
    try {
      const res = await fetch("/api/evaluacion-practica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha, hora: hora || null, lugar: lugar || null, tipoPractica }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo crear la evaluación"); setCreando(false); return; }
      window.location.href = `/evaluacion-practica/${data.id}`;
    } catch {
      setError("Error de conexión"); setCreando(false);
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-red-700" />
            Evaluación de Práctica
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Evaluación de simulacros y entrenamientos operativos</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {permiso?.esJefe && (
            <Link
              href="/evaluacion-practica/editores"
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2"
            >
              <Users className="w-3.5 h-3.5" /> Quién puede llenar
            </Link>
          )}
          {permiso?.puedeEditar && (
            <button
              onClick={abrirModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva evaluación
            </button>
          )}
        </div>
      </div>

      {evaluaciones === null ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      ) : evaluaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <ListChecks className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay evaluaciones registradas.</p>
          {permiso?.puedeEditar && <p className="text-xs text-gray-400 mt-1">Crea una nueva evaluación para empezar.</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
          {evaluaciones.map(ev => {
            const pct = ev.total_items > 0 ? Math.round((ev.si_count / ev.total_items) * 100) : 0;
            const nombre = ev.apellidos ? `${ev.apellidos}, ${ev.nombres}` : ev.creado_por_codigo;
            return (
              <Link
                key={ev.id}
                href={`/evaluacion-practica/${ev.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{ev.tipo_practica}</p>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {fmtFecha(ev.fecha)}</span>
                    {ev.lugar && (
                      <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.lugar}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">Registrado por {nombre}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  pct >= 80 ? "bg-green-100 text-green-700" :
                  pct >= 60 ? "bg-blue-100 text-blue-700" :
                  pct >= 40 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {ev.si_count}/{ev.total_items} · {pct}%
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-br from-red-700 to-red-800 px-5 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold">Nueva evaluación de práctica</h2>
              <button onClick={() => setModal(false)} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de práctica *</label>
                <select
                  value={tipoPractica}
                  onChange={e => setTipoPractica(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
                >
                  {TIPOS_PRACTICA.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha *</label>
                  <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora</label>
                  <input type="time" value={hora} onChange={e => setHora(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Lugar</label>
                <input value={lugar} onChange={e => setLugar(e.target.value)} placeholder="Lugar de la práctica"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30" />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50">Cancelar</button>
              <button onClick={crear} disabled={creando || !fecha}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2">
                {creando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creando ? "Creando..." : "Crear evaluación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
