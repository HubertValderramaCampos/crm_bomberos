"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ListChecks, Loader2, CheckCircle2, XCircle, Circle, Trash2,
} from "lucide-react";
import {
  SECCIONES_EVAL_PRACTICA, SECCION_EVAL_PRACTICA_LABEL, TIPOS_PRACTICA,
  type SeccionEvalPractica,
} from "@/lib/evaluacionPracticaCatalogo";

type Respuesta = "SI" | "NO" | null;

interface Item {
  id: number; seccion: SeccionEvalPractica; orden: number;
  descripcion: string; respuesta: Respuesta;
}
interface Evaluacion {
  id: number; fecha: string; hora: string | null; lugar: string | null;
  tipo_practica: string; comentarios: string | null;
  creado_por_codigo: string; apellidos: string | null; nombres: string | null;
  created_at: string; updated_at: string;
}
interface Detalle { evaluacion: Evaluacion; items: Item[]; puedeEditar: boolean }

export function EvaluacionPracticaDetalleClient({ evaluacionId }: { evaluacionId: string }) {
  const router = useRouter();
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [error, setError] = useState("");
  const [esJefe, setEsJefe] = useState(false);
  const [comentarios, setComentarios] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [lugar, setLugar] = useState("");
  const [tipoPractica, setTipoPractica] = useState("");
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    fetch(`/api/evaluacion-practica/${evaluacionId}`)
      .then(r => r.json())
      .then((data: Detalle) => {
        if (!data?.evaluacion) { setError("No se pudo cargar la evaluación"); return; }
        setDetalle(data);
        setComentarios(data.evaluacion.comentarios ?? "");
        setFecha(data.evaluacion.fecha.slice(0, 10));
        setHora(data.evaluacion.hora ?? "");
        setLugar(data.evaluacion.lugar ?? "");
        setTipoPractica(data.evaluacion.tipo_practica);
      })
      .catch(() => setError("No se pudo cargar la evaluación"));

    fetch("/api/evaluacion-practica/permiso")
      .then(r => r.json())
      .then(d => setEsJefe(!!d.esJefe))
      .catch(() => {});
  }, [evaluacionId]);

  const secciones = useMemo(() => {
    if (!detalle) return [];
    return SECCIONES_EVAL_PRACTICA.map(sec => [sec, detalle.items.filter(i => i.seccion === sec)] as const);
  }, [detalle]);

  async function marcar(itemId: number, respuesta: Respuesta) {
    setDetalle(prev => prev ? {
      ...prev,
      items: prev.items.map(i => i.id === itemId ? { ...i, respuesta } : i),
    } : prev);
    await fetch(`/api/evaluacion-practica/${evaluacionId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ respuesta }),
    }).catch(() => {});
  }

  async function guardarEncabezado() {
    await fetch(`/api/evaluacion-practica/${evaluacionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, hora: hora || null, lugar: lugar || null, tipoPractica }),
    }).catch(() => {});
  }

  async function guardarComentarios() {
    await fetch(`/api/evaluacion-practica/${evaluacionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comentarios }),
    }).catch(() => {});
  }

  async function eliminar() {
    if (!confirm("¿Eliminar esta evaluación? Se perderán todos los datos.")) return;
    setEliminando(true);
    await fetch(`/api/evaluacion-practica/${evaluacionId}`, { method: "DELETE" });
    router.push("/evaluacion-practica");
  }

  if (error) return <p className="text-sm text-red-600 text-center py-8">{error}</p>;
  if (!detalle) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
      </div>
    );
  }

  const { puedeEditar } = detalle;
  const siCount = detalle.items.filter(i => i.respuesta === "SI").length;
  const total = detalle.items.length;
  const pct = total > 0 ? Math.round((siCount / total) * 100) : 0;
  const nombre = detalle.evaluacion.apellidos
    ? `${detalle.evaluacion.apellidos}, ${detalle.evaluacion.nombres}`
    : detalle.evaluacion.creado_por_codigo;

  return (
    <div className="space-y-5 max-w-3xl pb-10">
      <div className="flex items-center justify-between gap-2">
        <Link href="/evaluacion-practica" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 w-fit">
          <ArrowLeft className="w-3.5 h-3.5" /> Evaluación de Práctica
        </Link>
        {esJefe && (
          <button onClick={eliminar} disabled={eliminando}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 disabled:opacity-50">
            {eliminando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Eliminar
          </button>
        )}
      </div>

      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-red-700" />
          {detalle.evaluacion.tipo_practica}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Registrado por {nombre}</p>
      </div>

      {/* Encabezado */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Tipo de práctica</label>
          <select
            value={tipoPractica}
            onChange={e => setTipoPractica(e.target.value)}
            onBlur={guardarEncabezado}
            disabled={!puedeEditar}
            className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            {TIPOS_PRACTICA.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} onBlur={guardarEncabezado}
              disabled={!puedeEditar}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Hora</label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)} onBlur={guardarEncabezado}
              disabled={!puedeEditar}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 block mb-1">Lugar</label>
          <input value={lugar} onChange={e => setLugar(e.target.value)} onBlur={guardarEncabezado}
            disabled={!puedeEditar} placeholder="Lugar de la práctica"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-400">Calificación</span>
          <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${
            pct >= 80 ? "bg-green-100 text-green-700" :
            pct >= 60 ? "bg-blue-100 text-blue-700" :
            pct >= 40 ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            {siCount}/{total} · {pct}%
          </span>
        </div>
      </div>

      {/* Secciones */}
      {secciones.map(([seccion, items]) => (
        <div key={seccion} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{SECCION_EVAL_PRACTICA_LABEL[seccion]}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                <p className="text-sm text-gray-800 flex-1 min-w-0">{item.descripcion}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {(["SI", "NO"] as const).map(r => {
                    const activo = item.respuesta === r;
                    const Icon = r === "SI" ? CheckCircle2 : XCircle;
                    return (
                      <button
                        key={r}
                        onClick={() => puedeEditar && marcar(item.id, activo ? null : r)}
                        disabled={!puedeEditar}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors disabled:cursor-default ${
                          activo
                            ? r === "SI" ? "bg-green-600 text-white border-green-600" : "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                        } ${!puedeEditar && !activo ? "opacity-30" : ""}`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {r}
                      </button>
                    );
                  })}
                  {!item.respuesta && <Circle className="w-3 h-3 text-gray-200 shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Comentarios finales */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Comentarios finales</label>
        <textarea
          value={comentarios}
          onChange={e => setComentarios(e.target.value)}
          onBlur={guardarComentarios}
          disabled={!puedeEditar}
          rows={4}
          placeholder="Comentarios generales de la práctica..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>
    </div>
  );
}
