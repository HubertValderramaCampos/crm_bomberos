"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Gauge, Plus, Loader2, ChevronRight, Truck, Camera, AlertTriangle,
} from "lucide-react";
import {
  NIVEL_COMBUSTIBLE_LABEL, NIVEL_ACEITE_REFRIGERANTE_LABEL,
  type NivelCombustible, type NivelAceiteRefrigerante,
} from "@/lib/reportePilotoCatalogo";

interface VehiculoOpcion { id: number; codigo: string; tipo: string }
interface ReporteRow {
  id: number; fecha: string; kilometraje: number;
  combustible: NivelCombustible; aceite: NivelAceiteRefrigerante; refrigerante: NivelAceiteRefrigerante;
  created_at: string; apellidos: string; nombres: string; grado: string | null;
  vehiculo_codigo: string; fotos_total: number;
}

function fmtFecha(iso: string) {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function NivelBadge({ label, alerta }: { label: string; alerta: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${alerta ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
      {alerta && <AlertTriangle className="w-2.5 h-2.5" />} {label}
    </span>
  );
}

export function ReportePilotoClient() {
  const [vehiculos, setVehiculos] = useState<VehiculoOpcion[]>([]);
  const [vehiculoId, setVehiculoId] = useState<number | null>(null);
  const [reportes, setReportes] = useState<ReporteRow[] | null>(null);

  useEffect(() => {
    fetch("/api/vehiculos-b150").then(r => r.json()).then((data: VehiculoOpcion[]) => setVehiculos(Array.isArray(data) ? data : [])).catch(() => setVehiculos([]));
  }, []);

  const cargar = useCallback(() => {
    const qs = vehiculoId ? `?vehiculoId=${vehiculoId}` : "";
    fetch(`/api/reporte-piloto${qs}`)
      .then(r => r.json())
      .then((data: ReporteRow[]) => setReportes(Array.isArray(data) ? data : []))
      .catch(() => setReportes([]));
  }, [vehiculoId]);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-red-700" />
            Reporte Diario de Pilotos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Kilometraje, niveles de fluidos y estado general de las unidades</p>
        </div>
        <Link
          href="/reporte-piloto/nuevo"
          className="flex items-center gap-1.5 px-3 py-2 bg-red-700 text-white text-xs font-semibold rounded-lg hover:bg-red-800 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo reporte
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setVehiculoId(null)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            vehiculoId === null ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
          }`}
        >
          Todas
        </button>
        {vehiculos.map(v => (
          <button
            key={v.id}
            onClick={() => setVehiculoId(v.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              vehiculoId === v.id ? "bg-red-700 text-white border-red-700" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            <Truck className="w-3 h-3" /> {v.codigo}
          </button>
        ))}
      </div>

      {reportes === null ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
        </div>
      ) : reportes.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <Gauge className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No hay reportes registrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
          {reportes.map(r => (
            <Link
              key={r.id}
              href={`/reporte-piloto/${r.id}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900">{r.vehiculo_codigo}</p>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{fmtFecha(r.fecha)}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{r.kilometraje.toLocaleString("es-PE")} km</span>
                  {r.fotos_total > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Camera className="w-3 h-3" /> {r.fotos_total}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {r.grado ? `${r.grado} ` : ""}{r.apellidos}, {r.nombres}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <NivelBadge label={NIVEL_COMBUSTIBLE_LABEL[r.combustible]} alerta={false} />
                <NivelBadge label={`Aceite ${NIVEL_ACEITE_REFRIGERANTE_LABEL[r.aceite] === "Full" ? "Full" : "Mín."}`} alerta={r.aceite === "MINIMO"} />
                <NivelBadge label={`Refrig. ${NIVEL_ACEITE_REFRIGERANTE_LABEL[r.refrigerante] === "Full" ? "Full" : "Mín."}`} alerta={r.refrigerante === "MINIMO"} />
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
