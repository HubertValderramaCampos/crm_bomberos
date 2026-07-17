"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { BedDouble, Check, X, AlertTriangle, Pencil, Users, Clock } from "lucide-react";
import { esRolGuardia } from "@/lib/roles";

interface Solicitud {
  id: number;
  bombero_id: number;
  pool: "MASCULINA" | "FEMENINA";
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA" | "CANCELADA";
  solicitado_en: string;
  resuelto_en: string | null;
  nota: string | null;
  codigo: string;
  grado: string;
  apellidos: string;
  nombres: string;
}

interface Persona { id: number; codigo: string; grado: string; apellidos: string; nombres: string }

interface Data {
  fecha: string;
  pools: { pool: "MASCULINA" | "FEMENINA"; capacidad: number }[];
  solicitudes: Solicitud[];
  miSolicitud: Solicitud | null;
  miSexo: "M" | "F" | null;
  puedeAdministrar: boolean;
  sinSolicitud: Persona[];
  horaLimiteAlcanzada: boolean;
}

const ESTADO_STYLE: Record<Solicitud["estado"], string> = {
  PENDIENTE:  "bg-amber-50 text-amber-700 border-amber-200",
  APROBADA:   "bg-green-50 text-green-700 border-green-200",
  RECHAZADA:  "bg-red-50 text-red-700 border-red-200",
  CANCELADA:  "bg-gray-50 text-gray-400 border-gray-200",
};

const ESTADO_LABEL: Record<Solicitud["estado"], string> = {
  PENDIENTE: "Pendiente", APROBADA: "Aprobada", RECHAZADA: "Rechazada", CANCELADA: "Cancelada",
};

const POOL_LABEL: Record<"MASCULINA" | "FEMENINA", string> = { MASCULINA: "Masculina", FEMENINA: "Femenina" };

function nombreCompleto(p: { apellidos: string; nombres: string }) {
  return `${p.apellidos.trim()}, ${p.nombres}`;
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

export function GuardiasClient() {
  const { data: session } = useSession();
  const rol = session?.user?.rol ?? "";
  const bomberoId = session?.user?.bomberoId ?? null;

  const [data, setData]       = useState<Data | null>(null);
  const [error, setError]     = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pidiendoSexo, setPidiendoSexo] = useState(false);
  const [editandoPool, setEditandoPool] = useState<"MASCULINA" | "FEMENINA" | null>(null);
  const [capInput, setCapInput] = useState("");

  const cargar = useCallback(() => {
    fetch("/api/guardias").then(r => r.json()).then(setData).catch(() => setError("No se pudo cargar"));
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 20000);
    return () => clearInterval(t);
  }, [cargar]);

  async function pedirGuardia(sexo?: "M" | "F") {
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/guardias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sexo ? { sexo } : {}),
      });
      const body = await res.json();
      if (!res.ok) {
        if (body.error === "FALTA_SEXO") { setPidiendoSexo(true); return; }
        setError(body.error ?? "No se pudo enviar la solicitud");
        return;
      }
      setPidiendoSexo(false);
      cargar();
    } finally {
      setEnviando(false);
    }
  }

  async function cancelarGuardia() {
    setEnviando(true);
    try {
      await fetch("/api/guardias", { method: "DELETE" });
      cargar();
    } finally {
      setEnviando(false);
    }
  }

  async function resolver(id: number, estado: "APROBADA" | "RECHAZADA") {
    await fetch(`/api/guardias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    cargar();
  }

  async function guardarCapacidad(poolNombre: "MASCULINA" | "FEMENINA") {
    const cap = Number(capInput);
    if (!Number.isInteger(cap) || cap < 0) return;
    await fetch("/api/guardias/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pool: poolNombre, capacidad: cap }),
    });
    setEditandoPool(null);
    cargar();
  }

  if (!data) {
    return <div className="text-sm text-gray-400 py-8 text-center">Cargando…</div>;
  }

  const puedeAdministrar = data.puedeAdministrar || esRolGuardia(rol);
  const fechaLabel = new Date(data.fecha + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="space-y-4 pb-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BedDouble className="w-5 h-5 text-red-700" />
          Guardias Nocturnas
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 capitalize">{fechaLabel} — se puede pedir hasta las 11:00 pm</p>
      </div>

      {/* Mi solicitud */}
      {bomberoId && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-2">Mi guardia de hoy</p>

          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          {!data.miSolicitud || data.miSolicitud.estado === "CANCELADA" ? (
            pidiendoSexo ? (
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600 mr-2">Primera vez — ¿en qué pool duermes?</p>
                <button onClick={() => pedirGuardia("M")} disabled={enviando}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100">
                  Masculina
                </button>
                <button onClick={() => pedirGuardia("F")} disabled={enviando}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100">
                  Femenina
                </button>
              </div>
            ) : data.horaLimiteAlcanzada ? (
              <p className="text-sm text-gray-400">Ya pasó el horario límite (11pm) para pedir guardia de hoy.</p>
            ) : (
              <button onClick={() => pedirGuardia()} disabled={enviando}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                Pedir guardia
              </button>
            )
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${ESTADO_STYLE[data.miSolicitud.estado]}`}>
                {ESTADO_LABEL[data.miSolicitud.estado]} — {POOL_LABEL[data.miSolicitud.pool]}
              </span>
              {(data.miSolicitud.estado === "PENDIENTE" || data.miSolicitud.estado === "APROBADA") && (
                <button onClick={cancelarGuardia} disabled={enviando}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors">
                  Cancelar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alerta: en turno sin solicitud, pasadas las 11pm */}
      {puedeAdministrar && data.horaLimiteAlcanzada && data.sinSolicitud.length > 0 && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3.5 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-red-800 leading-snug">
              <span className="font-bold">{data.sinSolicitud.length} efectivo{data.sinSolicitud.length === 1 ? "" : "s"}</span> en turno sin pedir guardia (ya pasaron las 11pm).
            </p>
            <p className="text-xs text-red-600/80 mt-1 leading-snug">
              {data.sinSolicitud.map(p => `${p.grado} ${p.apellidos.trim()}`).join(" · ")}
            </p>
          </div>
        </div>
      )}

      {/* Pools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.pools.map(p => {
          const solicitudesPool = data.solicitudes.filter(s => s.pool === p.pool);
          const aprobadas = solicitudesPool.filter(s => s.estado === "APROBADA");
          const pendientes = solicitudesPool.filter(s => s.estado === "PENDIENTE");
          const otras = solicitudesPool.filter(s => s.estado === "RECHAZADA" || s.estado === "CANCELADA");
          const ocupadas = aprobadas.length;
          const lleno = ocupadas >= p.capacidad;
          const pct = p.capacidad > 0 ? Math.min(100, Math.round((ocupadas / p.capacidad) * 100)) : 0;

          return (
            <div key={p.pool} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900 text-sm">{POOL_LABEL[p.pool]}</h2>
                <span className={`ml-auto text-xs font-bold tabular-nums ${lleno ? "text-red-600" : "text-gray-600"}`}>
                  {ocupadas}/{p.capacidad}
                </span>
                {puedeAdministrar && (
                  editandoPool === p.pool ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} value={capInput} onChange={e => setCapInput(e.target.value)}
                        className="w-14 border border-gray-300 rounded px-1.5 py-0.5 text-xs" autoFocus />
                      <button onClick={() => guardarCapacidad(p.pool)} className="text-green-600"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditandoPool(null)} className="text-gray-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditandoPool(p.pool); setCapInput(String(p.capacidad)); }} className="text-gray-300 hover:text-gray-500">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
              </div>

              <div className="h-1.5 bg-gray-100">
                <div className={`h-full transition-all ${lleno ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
              </div>

              <div className="divide-y divide-gray-50">
                {solicitudesPool.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">Sin solicitudes todavía.</p>
                )}
                {[...pendientes, ...aprobadas, ...otras].map(s => (
                  <div key={s.id} className="px-4 py-2.5 flex items-center gap-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{nombreCompleto(s)}</p>
                      <p className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtHora(s.solicitado_en)} · {s.grado}
                      </p>
                    </div>
                    {puedeAdministrar && s.estado === "PENDIENTE" ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => resolver(s.id, "APROBADA")}
                          className="p-1.5 rounded-lg bg-green-50 border border-green-200 text-green-600 hover:bg-green-100">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => resolver(s.id, "RECHAZADA")}
                          className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${ESTADO_STYLE[s.estado]}`}>
                        {ESTADO_LABEL[s.estado]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
