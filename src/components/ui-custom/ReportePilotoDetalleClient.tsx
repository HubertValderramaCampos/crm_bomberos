"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, Truck, Loader2, AlertTriangle } from "lucide-react";
import {
  NIVEL_COMBUSTIBLE_LABEL,
  type NivelCombustible, type NivelAceiteRefrigerante,
} from "@/lib/reportePilotoCatalogo";

interface Reporte {
  id: number; fecha: string; kilometraje: number;
  combustible: NivelCombustible; aceite: NivelAceiteRefrigerante; refrigerante: NivelAceiteRefrigerante;
  estado_neumaticos: string; estado_carroceria: string | null; estado_suspension: string | null;
  estado_espejos_vidrios: string | null; estado_cabina: string | null;
  created_at: string;
  bombero_id: number; apellidos: string; nombres: string; grado: string | null; bombero_codigo: string | null;
  vehiculo_id: number; vehiculo_codigo: string; vehiculo_tipo: string;
}
interface Foto { id: number; url: string | null }
interface Detalle { reporte: Reporte; fotos: Foto[] }

function fmtFechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Campo({ label, valor }: { label: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{valor}</p>
    </div>
  );
}

export function ReportePilotoDetalleClient({ reporteId }: { reporteId: string }) {
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/reporte-piloto/${reporteId}`)
      .then(r => r.json())
      .then((data: Detalle) => setDetalle(data))
      .catch(() => setError("No se pudo cargar el reporte"));
  }, [reporteId]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!detalle) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
      </div>
    );
  }

  const { reporte, fotos } = detalle;
  const hayAlertaFluidos = reporte.aceite === "MINIMO" || reporte.refrigerante === "MINIMO";

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <Link href="/reporte-piloto" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver a reportes
        </Link>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-red-700" />
          {reporte.vehiculo_codigo} · Reporte de Piloto
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">Reportado el {fmtFechaHora(reporte.created_at)}</p>
      </div>

      {hayAlertaFluidos && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          Este reporte indica nivel mínimo de {reporte.aceite === "MINIMO" && reporte.refrigerante === "MINIMO" ? "aceite y refrigerante" : reporte.aceite === "MINIMO" ? "aceite" : "refrigerante"}.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Piloto de turno</p>
            <p className="text-sm text-gray-900">{reporte.grado ? `${reporte.grado} ` : ""}{reporte.apellidos}, {reporte.nombres}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Unidad</p>
            <p className="text-sm text-gray-900 flex items-center gap-1.5"><Truck className="w-4 h-4 text-gray-400" /> {reporte.vehiculo_codigo}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Kilometraje</p>
            <p className="text-sm text-gray-900">{reporte.kilometraje.toLocaleString("es-PE")} km</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
            <p className="text-sm text-gray-900">{new Date(reporte.fecha.slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Nivel de fluidos</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Combustible</p>
              <p className="text-sm font-semibold text-gray-900">{NIVEL_COMBUSTIBLE_LABEL[reporte.combustible]}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Aceite</p>
              <p className={`text-sm font-semibold ${reporte.aceite === "MINIMO" ? "text-red-600" : "text-gray-900"}`}>
                {reporte.aceite === "MINIMO" ? "Mínimo" : "Full"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Refrigerante</p>
              <p className={`text-sm font-semibold ${reporte.refrigerante === "MINIMO" ? "text-red-600" : "text-gray-900"}`}>
                {reporte.refrigerante === "MINIMO" ? "Mínimo" : "Full"}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Reporte diario</p>
          <Campo label="Estado de los neumáticos" valor={reporte.estado_neumaticos} />
          <Campo label="Estado de la carrocería (exterior)" valor={reporte.estado_carroceria} />
          <Campo label="Estado del sistema de suspensión" valor={reporte.estado_suspension} />
          <Campo label="Estado de los espejos y vidrios" valor={reporte.estado_espejos_vidrios} />
          <Campo label="Estado de la cabina (interior)" valor={reporte.estado_cabina} />
        </div>

        {fotos.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
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
    </div>
  );
}
