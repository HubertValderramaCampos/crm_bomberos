"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, AlertTriangle, Truck, Wrench, Hammer, Loader2, Clock, Settings2, CheckCircle2,
} from "lucide-react";
import {
  TIPO_REPORTE_LABEL, CATEGORIA_EQUIPAMIENTO_LABEL, ESTADO_REPORTE_LABEL, ESTADOS_REPORTE,
  type TipoReporte, type CategoriaEquipamiento, type EstadoReporte,
} from "@/lib/incidenciasCatalogo";

interface Reporte {
  id: number; fecha: string; tipo_reporte: TipoReporte; categoria: CategoriaEquipamiento;
  descripcion: string; estado: EstadoReporte; created_at: string;
  bombero_id: number; apellidos: string; nombres: string; grado: string | null; bombero_codigo: string | null;
  vehiculo_id: number | null; vehiculo_codigo: string | null; vehiculo_tipo: string | null;
}
interface Foto { id: number; url: string | null }
interface Detalle { reporte: Reporte; fotos: Foto[]; puedeGestionar: boolean }

const CATEGORIA_ICON: Record<CategoriaEquipamiento, typeof Truck> = {
  VEHICULO: Truck, EQUIPO_FUERZA: Wrench, HERRAMIENTAS: Hammer,
};

const ESTADO_UI: Record<EstadoReporte, { icon: typeof Clock; cls: string }> = {
  PENDIENTE:  { icon: Clock,        cls: "bg-amber-50 text-amber-600" },
  EN_PROCESO: { icon: Settings2,    cls: "bg-blue-50 text-blue-600" },
  RESUELTO:   { icon: CheckCircle2, cls: "bg-green-50 text-green-600" },
};

function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function IncidenciaDetalleClient({ reporteId }: { reporteId: string }) {
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [error, setError] = useState("");
  const [cambiando, setCambiando] = useState(false);

  const cargar = useCallback(() => {
    fetch(`/api/incidencias/${reporteId}`)
      .then(r => r.json())
      .then((data: Detalle) => setDetalle(data))
      .catch(() => setError("No se pudo cargar el reporte"));
  }, [reporteId]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(estado: EstadoReporte) {
    setCambiando(true);
    try {
      await fetch(`/api/incidencias/${reporteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      cargar();
    } finally {
      setCambiando(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!detalle) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
      </div>
    );
  }

  const { reporte, fotos, puedeGestionar } = detalle;
  const CategoriaIcon = CATEGORIA_ICON[reporte.categoria];
  const estadoUi = ESTADO_UI[reporte.estado];
  const EstadoIcon = estadoUi.icon;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link href="/incidencias" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a incidencias
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700" />
            {TIPO_REPORTE_LABEL[reporte.tipo_reporte]}
          </h1>
          <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${estadoUi.cls}`}>
            <EstadoIcon className="w-3.5 h-3.5" /> {ESTADO_REPORTE_LABEL[reporte.estado]}
          </span>
        </div>
        <p className="text-sm text-gray-400 mt-0.5">Reportado el {fmtFechaHora(reporte.created_at)}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Responsable del registro</p>
            <p className="text-sm text-gray-900">
              {reporte.grado ? `${reporte.grado} ` : ""}{reporte.apellidos}, {reporte.nombres}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Equipamiento</p>
            <p className="text-sm text-gray-900 flex items-center gap-1.5">
              <CategoriaIcon className="w-4 h-4 text-gray-400" />
              {reporte.vehiculo_codigo ?? CATEGORIA_EQUIPAMIENTO_LABEL[reporte.categoria]}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Reporte</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{reporte.descripcion}</p>
        </div>

        {fotos.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Registro fotográfico</p>
            <div className="flex gap-2 flex-wrap">
              {fotos.map(f => f.url && (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt="Foto del reporte" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {puedeGestionar && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Gestionar estado</p>
          <div className="flex gap-2 flex-wrap">
            {ESTADOS_REPORTE.map(e => (
              <button
                key={e}
                type="button"
                disabled={cambiando || reporte.estado === e}
                onClick={() => cambiarEstado(e)}
                className={`px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors disabled:cursor-default ${
                  reporte.estado === e ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {ESTADO_REPORTE_LABEL[e]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
