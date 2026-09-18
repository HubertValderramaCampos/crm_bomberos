"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, Plus, Loader2, ChevronRight, Wrench, Hammer, Truck,
  Camera, Clock, Settings2, CheckCircle2,
} from "lucide-react";
import {
  TIPO_REPORTE_LABEL, CATEGORIA_EQUIPAMIENTO_LABEL, ESTADO_REPORTE_LABEL,
  type TipoReporte, type CategoriaEquipamiento, type EstadoReporte,
} from "@/lib/incidenciasCatalogo";

interface ReporteRow {
  id: number; fecha: string; tipo_reporte: TipoReporte; categoria: CategoriaEquipamiento;
  descripcion: string; estado: EstadoReporte; created_at: string;
  apellidos: string; nombres: string; grado: string | null;
  vehiculo_codigo: string | null; fotos_total: number;
}

const CATEGORIA_ICON: Record<CategoriaEquipamiento, typeof Truck> = {
  VEHICULO: Truck, EQUIPO_FUERZA: Wrench, HERRAMIENTAS: Hammer,
};

const ESTADO_UI: Record<EstadoReporte, { icon: typeof Clock; cls: string }> = {
  PENDIENTE:  { icon: Clock,        cls: "bg-amber-50 text-amber-600" },
  EN_PROCESO: { icon: Settings2,    cls: "bg-blue-50 text-blue-600" },
  RESUELTO:   { icon: CheckCircle2, cls: "bg-green-50 text-green-600" },
};

const FILTROS: { value: EstadoReporte | ""; label: string }[] = [
  { value: "",           label: "Todos" },
  { value: "PENDIENTE",  label: ESTADO_REPORTE_LABEL.PENDIENTE },
  { value: "EN_PROCESO", label: ESTADO_REPORTE_LABEL.EN_PROCESO },
  { value: "RESUELTO",   label: ESTADO_REPORTE_LABEL.RESUELTO },
];

function fmtFecha(iso: string) {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export function IncidenciasClient() {
  const [filtro, setFiltro] = useState<EstadoReporte | "">("");
  const [reportes, setReportes] = useState<ReporteRow[] | null>(null);

  const cargar = useCallback(() => {
    const qs = filtro ? `?estado=${filtro}` : "";
    fetch(`/api/incidencias${qs}`)
      .then(r => r.json())
      .then((data: ReporteRow[]) => setReportes(Array.isArray(data) ? data : []))
      .catch(() => setReportes([]));
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-700" />
            Registro de Incidencias / Operaciones B150
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Daños, mantenimiento pendiente e implementaciones de equipamiento</p>
        </div>
        <Link
          href="/incidencias/nuevo"
          className="flex items-center gap-1.5 px-3 py-2 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo reporte
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filtro === f.value
                ? "bg-red-700 text-white border-red-700"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {reportes === null ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      ) : reportes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <AlertTriangle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay reportes registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
          {reportes.map(r => {
            const CategoriaIcon = CATEGORIA_ICON[r.categoria];
            const estadoUi = ESTADO_UI[r.estado];
            const EstadoIcon = estadoUi.icon;
            return (
              <Link
                key={r.id}
                href={`/incidencias/${r.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${estadoUi.cls}`}>
                  <EstadoIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-900">{TIPO_REPORTE_LABEL[r.tipo_reporte]}</p>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CategoriaIcon className="w-3 h-3" />
                      {r.vehiculo_codigo ?? CATEGORIA_EQUIPAMIENTO_LABEL[r.categoria]}
                    </span>
                    {r.fotos_total > 0 && (
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Camera className="w-3 h-3" /> {r.fotos_total}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {r.grado ? `${r.grado} ` : ""}{r.apellidos}, {r.nombres} · {fmtFecha(r.fecha)}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${estadoUi.cls}`}>
                  {ESTADO_REPORTE_LABEL[r.estado]}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
