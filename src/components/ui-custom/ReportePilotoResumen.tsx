"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Fuel, Droplet, Thermometer, AlertTriangle, Loader2,
} from "lucide-react";
import {
  NIVEL_COMBUSTIBLE_LABEL, NIVEL_ACEITE_REFRIGERANTE_LABEL,
  type NivelCombustible, type NivelAceiteRefrigerante,
} from "@/lib/reportePilotoCatalogo";

interface ResumenRow {
  vehiculo_id: number; vehiculo_codigo: string; vehiculo_tipo: string;
  reporte_id: number | null; fecha: string | null; kilometraje: number | null;
  combustible: NivelCombustible | null; aceite: NivelAceiteRefrigerante | null; refrigerante: NivelAceiteRefrigerante | null;
  estado_neumaticos: string | null;
  apellidos: string | null; nombres: string | null; grado: string | null;
  dias_atraso: number | null;
}

const COMBUSTIBLE_ESTILO: Record<NivelCombustible, string> = {
  FULL:         "bg-green-100 text-green-700",
  TRES_CUARTOS: "bg-green-100 text-green-700",
  MEDIO:        "bg-amber-100 text-amber-700",
  UN_CUARTO:    "bg-red-100 text-red-700",
};

function FluidoBadge({ icon: Icon, nivel }: { icon: typeof Droplet; nivel: NivelAceiteRefrigerante }) {
  const alerta = nivel === "MINIMO";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${alerta ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
      {alerta ? <AlertTriangle className="w-2.5 h-2.5" /> : <Icon className="w-2.5 h-2.5" />}
      {NIVEL_ACEITE_REFRIGERANTE_LABEL[nivel] === "Full" ? "Full" : "Mín."}
    </span>
  );
}

function fmtFechaCorta(iso: string) {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}

function FechaBadge({ fecha, dias }: { fecha: string | null; dias: number | null }) {
  if (!fecha || dias === null) {
    return <span className="text-xs font-semibold text-gray-400">Sin reporte</span>;
  }
  const label = dias === 0 ? "Hoy" : dias === 1 ? "Ayer" : `Hace ${dias} días`;
  const estilo = dias === 0 ? "text-green-700" : dias === 1 ? "text-gray-500" : "text-amber-700";
  return (
    <div>
      <p className={`text-xs font-semibold ${estilo}`}>{label}</p>
      <p className="text-[10px] text-gray-400">{fmtFechaCorta(fecha)}</p>
    </div>
  );
}

export function ReportePilotoResumen() {
  const router = useRouter();
  const [filas, setFilas] = useState<ResumenRow[] | null>(null);

  useEffect(() => {
    fetch("/api/reporte-piloto/resumen")
      .then(r => r.json())
      .then((data: ResumenRow[]) => setFilas(Array.isArray(data) ? data : []))
      .catch(() => setFilas([]));
  }, []);

  if (filas === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center bg-white rounded-xl border border-gray-200">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando resumen de flota...
      </div>
    );
  }

  const reportadasHoy = filas.filter(f => f.dias_atraso === 0).length;
  const sinReporte = filas.filter(f => f.reporte_id === null).length;
  const alertasFluidos = filas.filter(f => f.aceite === "MINIMO" || f.refrigerante === "MINIMO").length;
  const combustibleBajo = filas.filter(f => f.combustible === "MEDIO" || f.combustible === "UN_CUARTO").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="w-4 h-4 text-red-700" />
        <p className="text-sm font-semibold text-gray-900">Resumen de la flota</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Reportadas hoy", value: `${reportadasHoy}/${filas.length}`, color: reportadasHoy === filas.length ? "text-green-600" : "text-amber-600" },
          { label: "Sin reporte", value: sinReporte, color: sinReporte > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Alertas de fluidos", value: alertasFluidos, color: alertasFluidos > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Combustible bajo", value: combustibleBajo, color: combustibleBajo > 0 ? "text-amber-600" : "text-gray-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Unidad</th>
              <th className="text-left px-3 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Piloto</th>
              <th className="text-left px-3 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Fecha</th>
              <th className="text-left px-3 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Combustible</th>
              <th className="text-left px-3 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Aceite</th>
              <th className="text-left px-3 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Refrig.</th>
              <th className="text-left px-4 py-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filas.map(f => {
              const piloto = f.apellidos
                ? `${f.grado ? `${f.grado} ` : ""}${f.apellidos}, ${f.nombres}`
                : null;
              const contenido = (
                <>
                  <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{f.vehiculo_codigo}</td>
                  <td className="px-3 py-2.5 text-xs text-gray-700 whitespace-nowrap">{piloto ?? <span className="text-gray-400">—</span>}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap"><FechaBadge fecha={f.fecha} dias={f.dias_atraso} /></td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {f.combustible ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${COMBUSTIBLE_ESTILO[f.combustible]}`}>
                        <Fuel className="w-2.5 h-2.5" /> {NIVEL_COMBUSTIBLE_LABEL[f.combustible]}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {f.aceite ? <FluidoBadge icon={Droplet} nivel={f.aceite} /> : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {f.refrigerante ? <FluidoBadge icon={Thermometer} nivel={f.refrigerante} /> : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-500 max-w-xs truncate" title={f.estado_neumaticos ?? undefined}>
                    {f.estado_neumaticos ?? "—"}
                  </td>
                </>
              );
              return f.reporte_id ? (
                <tr
                  key={f.vehiculo_id}
                  onClick={() => router.push(`/reporte-piloto/${f.reporte_id}`)}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {contenido}
                </tr>
              ) : (
                <tr key={f.vehiculo_id} className="opacity-60">{contenido}</tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
