"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ClipboardCheck, Truck, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ChevronRight, Settings, Clock, PlusCircle,
} from "lucide-react";

interface Vehiculo { id: number; codigo: string; tipo: string }
interface Registro {
  id: number; vehiculo_id: number; vehiculo_codigo: string; fecha: string; estado: string;
  bombero_id: number; bombero_codigo: string | null; grado: string | null;
  apellidos: string; nombres: string;
  created_at: string; completado_en: string | null;
  items_total: number; items_marcados: number; items_malos: number; items_faltantes: number;
}

const ROLES_JEFE = ["JEFE_COMPANIA", "SEGUNDO_JEFE", "ADMINISTRACION"];

function hoyLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtFecha(iso: string) {
  return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" });
}

export function ChecklistClient() {
  const { data: session } = useSession();
  const esJefe = ROLES_JEFE.includes(session?.user?.rol ?? "");

  const [vehiculos, setVehiculos] = useState<Vehiculo[] | null>(null);
  const [vehiculoId, setVehiculoId] = useState<number | null>(null);
  const [registros, setRegistros] = useState<Registro[] | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/checklist/vehiculos")
      .then(r => r.json())
      .then((data: Vehiculo[]) => {
        setVehiculos(data);
        if (data.length > 0) setVehiculoId(data[0].id);
      })
      .catch(() => setVehiculos([]));
  }, []);

  const cargarRegistros = useCallback(() => {
    if (!vehiculoId) return;
    fetch(`/api/checklist/registros?vehiculoId=${vehiculoId}&limit=15`)
      .then(r => r.json())
      .then((data: Registro[]) => setRegistros(Array.isArray(data) ? data : []))
      .catch(() => setRegistros([]));
  }, [vehiculoId]);

  useEffect(() => { cargarRegistros(); }, [cargarRegistros]);

  async function iniciarChecklist() {
    if (!vehiculoId) return;
    setIniciando(true);
    setError("");
    try {
      const res = await fetch("/api/checklist/registros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehiculoId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el checklist");
        setIniciando(false);
        return;
      }
      window.location.href = `/checklist/${data.id}`;
    } catch {
      setError("Error de conexión");
      setIniciando(false);
    }
  }

  const hoy = hoyLocal();
  const registrosVehiculo = registros?.filter(r => r.vehiculo_id === vehiculoId) ?? null;
  const registroHoy = registrosVehiculo?.find(r => r.fecha.slice(0, 10) === hoy) ?? null;
  const vehiculoActual = vehiculos?.find(v => v.id === vehiculoId) ?? null;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-red-700" />
            Checklist de Unidades
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Inspección de equipamiento por unidad</p>
        </div>
        {esJefe && (
          <Link
            href="/checklist/catalogo"
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-2 shrink-0"
          >
            <Settings className="w-3.5 h-3.5" /> Catálogo
          </Link>
        )}
      </div>

      {vehiculos === null ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Cargando unidades...
        </div>
      ) : vehiculos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay unidades con checklist configurado.</p>
      ) : (
        <>
          {/* Selector de unidad */}
          <div className="flex gap-2 flex-wrap">
            {vehiculos.map(v => (
              <button
                key={v.id}
                onClick={() => setVehiculoId(v.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  vehiculoId === v.id
                    ? "bg-red-700 text-white border-red-700"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Truck className="w-4 h-4" />
                {v.codigo}
              </button>
            ))}
          </div>

          {/* Estado de hoy */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Hoy · {vehiculoActual?.codigo}
            </p>

            {registrosVehiculo === null ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
              </div>
            ) : registroHoy ? (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  registroHoy.estado === "COMPLETADO" ? "bg-green-50" : "bg-amber-50"
                }`}>
                  {registroHoy.estado === "COMPLETADO"
                    ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                    : <Clock className="w-5 h-5 text-amber-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {registroHoy.estado === "COMPLETADO" ? "Checklist completado" : "Checklist en progreso"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {registroHoy.grado ? `${registroHoy.grado} ` : ""}{registroHoy.apellidos}, {registroHoy.nombres}
                    {registroHoy.estado === "COMPLETADO" && (registroHoy.items_malos + registroHoy.items_faltantes > 0) && (
                      <span className="text-amber-600"> · {registroHoy.items_malos + registroHoy.items_faltantes} hallazgo(s)</span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/checklist/${registroHoy.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-800 shrink-0"
                >
                  {registroHoy.estado === "COMPLETADO" ? "Ver detalle" : "Continuar"} <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-400">Nadie ha revisado esta unidad hoy.</p>
                <button
                  onClick={iniciarChecklist}
                  disabled={iniciando || !session?.user?.bomberoId}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-lg hover:bg-red-800 disabled:opacity-40 transition-colors shrink-0"
                >
                  {iniciando ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  Iniciar checklist
                </button>
              </div>
            )}
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            {!session?.user?.bomberoId && (
              <p className="text-xs text-gray-400 mt-2">Tu cuenta no está vinculada a un efectivo, no puedes iniciar un checklist.</p>
            )}
          </div>

          {/* Historial */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Historial reciente</p>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
              {registrosVehiculo === null ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Cargando...</div>
              ) : registrosVehiculo.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">Sin registros todavía.</div>
              ) : registrosVehiculo.map(r => (
                <Link
                  key={r.id}
                  href={`/checklist/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    r.estado !== "COMPLETADO" ? "bg-amber-50"
                    : (r.items_malos + r.items_faltantes) > 0 ? "bg-amber-50" : "bg-green-50"
                  }`}>
                    {r.estado !== "COMPLETADO"
                      ? <Clock className="w-4 h-4 text-amber-500" />
                      : (r.items_malos + r.items_faltantes) > 0
                        ? <AlertTriangle className="w-4 h-4 text-amber-500" />
                        : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {fmtFecha(r.fecha)} · {r.grado ? `${r.grado} ` : ""}{r.apellidos}, {r.nombres}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {r.estado === "COMPLETADO"
                        ? (r.items_malos + r.items_faltantes) > 0
                          ? `${r.items_malos} malo(s) · ${r.items_faltantes} falta(n)`
                          : "Sin hallazgos"
                        : `En progreso · ${r.items_marcados}/${r.items_total} marcados`}
                    </p>
                  </div>
                  {(r.items_malos + r.items_faltantes) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 shrink-0">
                      <XCircle className="w-3 h-3" /> {r.items_malos + r.items_faltantes}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
