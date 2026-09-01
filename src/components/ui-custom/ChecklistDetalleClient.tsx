"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Circle,
  Loader2, ClipboardCheck, Camera, X,
} from "lucide-react";

type EstadoItem = "PENDIENTE" | "BUENO" | "MALO" | "FALTA";

interface RegistroItem {
  id: number; item_id: number; seccion: string; orden: number;
  articulo: string; cantidad: number | null;
  estado: EstadoItem; observacion: string | null; foto_url: string | null;
}

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
interface Registro {
  id: number; vehiculo_id: number; vehiculo_codigo: string; vehiculo_tipo: string;
  fecha: string; estado: string; observaciones: string | null; efectivo_al_mando: string | null;
  created_at: string; completado_en: string | null;
  bombero_id: number; bombero_codigo: string | null; grado: string | null;
  apellidos: string; nombres: string;
}
interface Detalle { registro: Registro; items: RegistroItem[]; puedeEditar: boolean }

const ESTADO_UI: Record<EstadoItem, { label: string; icon: typeof Circle; activeCls: string }> = {
  PENDIENTE: { label: "—",     icon: Circle,        activeCls: "" },
  BUENO:     { label: "Bueno", icon: CheckCircle2,  activeCls: "bg-green-600 text-white border-green-600" },
  MALO:      { label: "Malo",  icon: XCircle,       activeCls: "bg-red-600 text-white border-red-600" },
  FALTA:     { label: "Falta", icon: AlertTriangle, activeCls: "bg-amber-500 text-white border-amber-500" },
};

export function ChecklistDetalleClient({ registroId }: { registroId: string }) {
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [error, setError] = useState("");
  const [completando, setCompletando] = useState(false);
  const [obsGeneral, setObsGeneral] = useState("");
  const [efectivoMando, setEfectivoMando] = useState("");

  useEffect(() => {
    fetch(`/api/checklist/registros/${registroId}`)
      .then(r => r.json())
      .then((data: Detalle) => {
        setDetalle(data);
        setObsGeneral(data.registro?.observaciones ?? "");
        setEfectivoMando(data.registro?.efectivo_al_mando ?? "");
      })
      .catch(() => setError("No se pudo cargar el checklist"));
  }, [registroId]);

  const secciones = useMemo(() => {
    if (!detalle) return [];
    const mapa = new Map<string, RegistroItem[]>();
    for (const it of detalle.items) {
      if (!mapa.has(it.seccion)) mapa.set(it.seccion, []);
      mapa.get(it.seccion)!.push(it);
    }
    return Array.from(mapa.entries());
  }, [detalle]);

  async function marcarItem(itemRegId: number, estado: EstadoItem) {
    setDetalle(prev => prev ? {
      ...prev,
      items: prev.items.map(it => it.id === itemRegId ? { ...it, estado } : it),
    } : prev);
    await fetch(`/api/checklist/registros/${registroId}/items/${itemRegId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    }).catch(() => {});
  }

  async function guardarObservacionItem(itemRegId: number, observacion: string) {
    await fetch(`/api/checklist/registros/${registroId}/items/${itemRegId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observacion }),
    }).catch(() => {});
  }

  async function subirFotoItem(itemRegId: number, file: File) {
    const base64 = await archivoABase64(file);
    const subida = await fetch("/api/upload-imagen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagen: base64 }),
    }).then(r => r.json());
    if (!subida.key) return;

    setDetalle(prev => prev ? {
      ...prev,
      items: prev.items.map(it => it.id === itemRegId ? { ...it, foto_url: subida.url } : it),
    } : prev);
    await fetch(`/api/checklist/registros/${registroId}/items/${itemRegId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotoKey: subida.key }),
    }).catch(() => {});
  }

  async function quitarFotoItem(itemRegId: number) {
    setDetalle(prev => prev ? {
      ...prev,
      items: prev.items.map(it => it.id === itemRegId ? { ...it, foto_url: null } : it),
    } : prev);
    await fetch(`/api/checklist/registros/${registroId}/items/${itemRegId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fotoKey: null }),
    }).catch(() => {});
  }

  async function guardarEncabezado() {
    await fetch(`/api/checklist/registros/${registroId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observaciones: obsGeneral, efectivoAlMando: efectivoMando }),
    }).catch(() => {});
  }

  async function completar() {
    if (!detalle) return;
    const pendientes = detalle.items.filter(i => i.estado === "PENDIENTE").length;
    if (pendientes > 0 && !confirm(`Quedan ${pendientes} ítem(s) sin marcar. ¿Completar de todas formas?`)) return;

    setCompletando(true);
    await guardarEncabezado();
    const res = await fetch(`/api/checklist/registros/${registroId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completar: true }),
    });
    setCompletando(false);
    if (res.ok) {
      const r = await fetch(`/api/checklist/registros/${registroId}`).then(x => x.json());
      setDetalle(r);
    }
  }

  if (error) return <p className="text-sm text-red-600 text-center py-8">{error}</p>;
  if (!detalle) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
      </div>
    );
  }

  const { registro, puedeEditar } = detalle;
  const malos = detalle.items.filter(i => i.estado === "MALO").length;
  const faltas = detalle.items.filter(i => i.estado === "FALTA").length;
  const marcados = detalle.items.filter(i => i.estado !== "PENDIENTE").length;

  return (
    <div className="space-y-5 max-w-3xl pb-10">
      <Link href="/checklist" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 w-fit">
        <ArrowLeft className="w-3.5 h-3.5" /> Checklist de Unidades
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-red-700" />
          {registro.vehiculo_codigo} <span className="text-gray-300 font-normal">·</span>{" "}
          <span className="text-base font-semibold text-gray-500">{registro.vehiculo_tipo}</span>
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date(registro.fecha.slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Encabezado */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-gray-400">Efectivo ejecutor</p>
            <p className="text-sm font-semibold text-gray-900">
              {registro.grado ? `${registro.grado} ` : ""}{registro.apellidos}, {registro.nombres}
              {registro.bombero_codigo && <span className="text-gray-400 font-normal font-mono text-xs"> · {registro.bombero_codigo}</span>}
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            registro.estado === "COMPLETADO" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
          }`}>
            {registro.estado === "COMPLETADO" ? "COMPLETADO" : "EN PROGRESO"}
          </span>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Efectivo al mando</label>
          <input
            value={efectivoMando}
            onChange={e => setEfectivoMando(e.target.value)}
            onBlur={guardarEncabezado}
            disabled={!puedeEditar}
            placeholder="Nombre del oficial al mando"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        {(malos + faltas) > 0 && (
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {malos} malo(s) · {faltas} falta(n) de {detalle.items.length} ítems
          </p>
        )}
      </div>

      {/* Ítems por sección */}
      {secciones.map(([seccion, items]) => (
        <div key={seccion} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{seccion}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(it => (
              <ItemRow
                key={it.id}
                item={it}
                puedeEditar={puedeEditar}
                onMarcar={estado => marcarItem(it.id, estado)}
                onGuardarObs={obs => guardarObservacionItem(it.id, obs)}
                onSubirFoto={file => subirFotoItem(it.id, file)}
                onQuitarFoto={() => quitarFotoItem(it.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Observaciones generales */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Observaciones</label>
        <textarea
          value={obsGeneral}
          onChange={e => setObsGeneral(e.target.value)}
          onBlur={guardarEncabezado}
          disabled={!puedeEditar}
          rows={3}
          placeholder="Observaciones generales del checklist..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      </div>

      {puedeEditar && (
        <div className="sticky bottom-4">
          <button
            onClick={completar}
            disabled={completando}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-700 text-white font-semibold rounded-xl shadow-lg hover:bg-red-800 disabled:opacity-50 transition-colors"
          >
            {completando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Completar checklist ({marcados}/{detalle.items.length} marcados)
          </button>
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item, puedeEditar, onMarcar, onGuardarObs, onSubirFoto, onQuitarFoto,
}: {
  item: RegistroItem; puedeEditar: boolean;
  onMarcar: (estado: EstadoItem) => void;
  onGuardarObs: (obs: string) => void;
  onSubirFoto: (file: File) => Promise<void>;
  onQuitarFoto: () => void;
}) {
  const [obs, setObs] = useState(item.observacion ?? "");
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mostrarObs = item.estado === "MALO" || item.estado === "FALTA";

  async function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSubiendo(true);
    await onSubirFoto(file).catch(() => {});
    setSubiendo(false);
  }

  return (
    <div className="px-4 sm:px-5 py-3 space-y-2.5">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-medium text-gray-900 flex-1 min-w-0">{item.articulo}</p>
        {item.cantidad != null && <p className="text-[11px] text-gray-400 shrink-0">Cant. {item.cantidad}</p>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["BUENO", "MALO", "FALTA"] as EstadoItem[]).map(estado => {
          const ui = ESTADO_UI[estado];
          const Icon = ui.icon;
          const activo = item.estado === estado;
          return (
            <button
              key={estado}
              onClick={() => puedeEditar && onMarcar(estado)}
              disabled={!puedeEditar}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-xs font-semibold transition-colors disabled:cursor-default active:scale-95 ${
                activo ? ui.activeCls : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              } ${!puedeEditar && !activo ? "opacity-30" : ""}`}
            >
              <Icon className="w-4 h-4 shrink-0" /> {ui.label}
            </button>
          );
        })}
      </div>
      {mostrarObs && (
        <input
          value={obs}
          onChange={e => setObs(e.target.value)}
          onBlur={() => onGuardarObs(obs)}
          disabled={!puedeEditar}
          placeholder="Observación (opcional)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-200"
        />
      )}
      {mostrarObs && (
        <div>
          {item.foto_url ? (
            <div className="relative w-24 h-24">
              <a href={item.foto_url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.foto_url} alt="Evidencia" className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
              </a>
              {puedeEditar && (
                <button
                  onClick={onQuitarFoto}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-gray-900 text-white rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : puedeEditar ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={elegirFoto} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={subiendo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:border-gray-300 disabled:opacity-50"
              >
                {subiendo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {subiendo ? "Subiendo..." : "Agregar foto"}
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
