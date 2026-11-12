"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity, RefreshCw, LogIn, LogOut, Moon, Users, UserCheck, UserX,
  Clock, ChevronDown, ChevronUp, AlertCircle, WifiOff, type LucideIcon,
} from "lucide-react";

// Cada cuánto se vuelve a consultar al servidor. Es sondeo (no websockets):
// el servidor corre en funciones serverless y 10 s alcanza para que una
// entrada o salida recién marcada aparezca casi al instante.
const INTERVALO_MS = 10_000;

interface Persona {
  id: number; apellidos: string; nombres: string; codigo: string | null;
  categoria: string; foto_url: string | null;
}
interface Presente extends Persona {
  asistencia_id: number; fecha: string; hora_entrada: string; minutos: number;
  tipo: string; motivo: string | null; guardia_nocturna: boolean;
  posible_salida_no_marcada: boolean;
}
interface Salida extends Persona {
  fecha: string; hora_entrada: string; hora_salida: string;
  tipo: string; motivo: string | null; guardia_nocturna: boolean;
}
interface Data {
  fecha: string; hora: string | null;
  presentes: Presente[]; salieron: Salida[]; sin_registro: Persona[]; total: number;
}

const CAT_PILL: Record<string, string> = {
  ASPIRANTE:  "bg-blue-100 text-blue-700",
  POSTULANTE: "bg-purple-100 text-purple-700",
};
const CAT_AVATAR: Record<string, string> = {
  ASPIRANTE:  "bg-blue-600",
  POSTULANTE: "bg-purple-600",
};

function fmtHora(t: string | null | undefined) { return t ? t.slice(0, 5) : "—"; }

function fmtDuracion(min: number) {
  if (min < 1) return "recién llegó";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function fmtFechaLarga(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long" });
}

function iniciales(p: Persona) {
  return `${p.apellidos.trim().charAt(0)}${p.nombres.trim().charAt(0)}`.toUpperCase();
}

function Avatar({ p, size = "w-11 h-11" }: { p: Persona; size?: string }) {
  if (p.foto_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={p.foto_url} alt="" className={`${size} rounded-full object-cover border border-gray-200 shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full ${CAT_AVATAR[p.categoria] ?? "bg-gray-500"} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
      {iniciales(p)}
    </div>
  );
}

function Pill({ categoria }: { categoria: string }) {
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${CAT_PILL[categoria] ?? "bg-gray-100 text-gray-600"}`}>
      {categoria}
    </span>
  );
}

function Seccion({ titulo, n, abierto, onToggle, icon: Icon, children }: {
  titulo: string; n: number; abierto: boolean; onToggle: () => void; icon: LucideIcon; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left">
        <span className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-bold text-gray-900">{titulo}</span>
          <span className="text-xs text-gray-400">({n})</span>
        </span>
        {abierto ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {abierto && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

export function PresentesFormativoClient() {
  const [data,           setData]           = useState<Data | null>(null);
  const [error,          setError]          = useState("");
  const [cargando,       setCargando]       = useState(false);
  const [actualizadoEn,  setActualizadoEn]  = useState<number | null>(null);
  const [ahora,          setAhora]          = useState(() => Date.now());
  const [verSalieron,    setVerSalieron]    = useState(true);
  const [verSinRegistro, setVerSinRegistro] = useState(false);
  const enVuelo = useRef(false);

  const cargar = useCallback(async () => {
    if (enVuelo.current) return; // no apilar consultas si una tarda más que el intervalo
    enVuelo.current = true;
    setCargando(true);
    try {
      const res = await fetch("/api/formativa/presentes", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json: Data = await res.json();
      setData(json);
      setActualizadoEn(Date.now());
      setError("");
    } catch {
      // Se conserva la última lectura buena en pantalla; solo se avisa.
      setError("No se pudo actualizar. Se vuelve a intentar automáticamente.");
    } finally {
      enVuelo.current = false;
      setCargando(false);
    }
  }, []);

  // Sondeo mientras la pestaña esté visible, y refresco inmediato al volver a ella.
  useEffect(() => {
    cargar();
    const t = setInterval(() => { if (document.visibilityState === "visible") cargar(); }, INTERVALO_MS);
    const onVis = () => { if (document.visibilityState === "visible") cargar(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [cargar]);

  // Reloj de 1 s: mueve el "hace X s" y hace avanzar el tiempo en la compañía entre sondeos.
  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const segDesdeActualizacion = actualizadoEn === null ? null : Math.max(0, Math.floor((ahora - actualizadoEn) / 1000));
  const minExtra = actualizadoEn === null ? 0 : Math.floor((ahora - actualizadoEn) / 60000);

  const presentes = data?.presentes ?? [];
  const nAsp      = presentes.filter(p => p.categoria === "ASPIRANTE").length;
  const nPos      = presentes.filter(p => p.categoria === "POSTULANTE").length;
  const nNocturna = presentes.filter(p => p.guardia_nocturna).length;

  return (
    <div className="space-y-5 pb-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-700" />
            Presentes en la compañía
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Aspirantes y postulantes con entrada marcada y sin salida
            {data?.fecha && <span className="capitalize"> · {fmtFechaLarga(data.fecha)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded-full">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-green-500 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-green-600" />
            </span>
            En vivo
          </span>
          <button type="button" onClick={cargar} disabled={cargando}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 bg-white px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? "animate-spin" : ""}`} />
            {segDesdeActualizacion === null ? "Cargando..." : segDesdeActualizacion < 2 ? "Actualizado ahora" : `Hace ${segDesdeActualizacion} s`}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl border bg-amber-50 text-amber-700 border-amber-200 text-sm font-medium flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!data ? (
        !error && <div className="flex justify-center py-12 text-sm text-gray-400">Cargando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "En la compañía",   value: presentes.length,         color: "text-green-700",  bg: "bg-green-50 border-green-200" },
              { label: "Aspirantes",       value: nAsp,                     color: "text-blue-700",   bg: "bg-white border-gray-200" },
              { label: "Postulantes",      value: nPos,                     color: "text-purple-700", bg: "bg-white border-gray-200" },
              { label: "Ya salieron hoy",  value: data.salieron.length,     color: "text-gray-900",   bg: "bg-white border-gray-200" },
              { label: "Sin registro hoy", value: data.sin_registro.length, color: "text-gray-400",   bg: "bg-white border-gray-200" },
            ].map(k => (
              <div key={k.label} className={`rounded-xl border p-4 ${k.bg}`}>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Presentes ahora */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2 flex-wrap">
              <UserCheck className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-gray-900">En la compañía ahora</span>
              <span className="text-xs text-gray-400">({presentes.length} de {data.total})</span>
              {nNocturna > 0 && (
                <span className="ml-auto flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                  <Moon className="w-3 h-3" /> {nNocturna} en guardia nocturna
                </span>
              )}
            </div>

            {presentes.length === 0 ? (
              <div className="text-center py-10 px-4 text-sm text-gray-400">
                <UserX className="w-7 h-7 mx-auto mb-2 text-gray-200" />
                No hay aspirantes ni postulantes en la compañía en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {presentes.map(p => {
                  const minutos   = p.minutos + minExtra;
                  const desdeAyer = p.fecha !== data.fecha;
                  const alerta    = p.posible_salida_no_marcada;
                  return (
                    <div key={p.asistencia_id}
                      className={`rounded-xl border p-3.5 flex gap-3 ${alerta ? "border-amber-200 bg-amber-50/40" : "border-green-200 bg-green-50/40"}`}>
                      <Avatar p={p} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{p.apellidos}</p>
                            <p className="text-xs text-gray-600 truncate">{p.nombres}</p>
                          </div>
                          <Pill categoria={p.categoria} />
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <LogIn className="w-3.5 h-3.5 text-green-600" />
                            {fmtHora(p.hora_entrada)}
                            {desdeAyer && <span className="text-gray-400">(ayer)</span>}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-gray-800">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {fmtDuracion(minutos)}
                          </span>
                        </div>
                        {(p.guardia_nocturna || p.tipo === "extra" || alerta) && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {p.guardia_nocturna && (
                              <span className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                                <Moon className="w-2.5 h-2.5" /> Guardia nocturna
                              </span>
                            )}
                            {p.tipo === "extra" && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium" title={p.motivo ?? undefined}>
                                Extra{p.motivo ? ` · ${p.motivo}` : ""}
                              </span>
                            )}
                            {alerta && (
                              <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                                <AlertCircle className="w-2.5 h-2.5" /> Posible salida no marcada
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ya salieron hoy */}
          <Seccion titulo="Ya salieron hoy" n={data.salieron.length} abierto={verSalieron} onToggle={() => setVerSalieron(v => !v)} icon={LogOut}>
            {data.salieron.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nadie ha marcado salida hoy.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.salieron.map(s => (
                  <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                    <Avatar p={s} size="w-9 h-9" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {s.apellidos}, <span className="font-normal text-gray-600">{s.nombres}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Pill categoria={s.categoria} />
                        {s.guardia_nocturna && (
                          <span className="flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                            <Moon className="w-2.5 h-2.5" /> Nocturna
                          </span>
                        )}
                        {s.tipo === "extra" && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium" title={s.motivo ?? undefined}>Extra</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
                      <span className="flex items-center gap-1"><LogIn className="w-3 h-3 text-green-500" />{fmtHora(s.hora_entrada)}</span>
                      <span className="flex items-center gap-1"><LogOut className="w-3 h-3 text-blue-500" />{fmtHora(s.hora_salida)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          {/* Sin registro hoy */}
          <Seccion titulo="Sin registro hoy" n={data.sin_registro.length} abierto={verSinRegistro} onToggle={() => setVerSinRegistro(v => !v)} icon={Users}>
            {data.sin_registro.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Todos los aspirantes y postulantes tienen registro hoy.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-4">
                {data.sin_registro.map(b => (
                  <div key={b.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60">
                    <Avatar p={b} size="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{b.apellidos}</p>
                      <p className="text-[11px] text-gray-500 truncate">{b.nombres}</p>
                    </div>
                    <Pill categoria={b.categoria} />
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          <p className="text-[11px] text-gray-400 text-center">
            Se actualiza solo cada {INTERVALO_MS / 1000} segundos
            {data.hora ? ` · última lectura del servidor a las ${data.hora.slice(0, 8)} (hora de Lima)` : ""}.
          </p>
        </>
      )}
    </div>
  );
}
