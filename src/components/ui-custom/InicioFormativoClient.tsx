"use client";

import { useState } from "react";
import {
  CalendarCheck, BookOpen, CheckCircle2, Clock,
  LogIn, LogOut, Star, ChevronDown, ChevronUp, FileText,
} from "lucide-react";
import Link from "next/link";

interface Asistencia {
  id: number; fecha: string; hora_entrada: string; hora_salida: string | null;
}

interface Nota {
  id: number; titulo: string; contenido: string | null;
  calificacion: number | null; fecha: string; creado_por_codigo: string | null;
}

function formatFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
}

function formatHora(t: string | null) {
  return t ? t.slice(0, 5) : "—";
}

const CATEGORIA_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  ASPIRANTE:  { bg: "bg-blue-100",  text: "text-blue-700",  label: "Aspirante"  },
  POSTULANTE: { bg: "bg-purple-100", text: "text-purple-700", label: "Postulante" },
};

export function InicioFormativoClient({
  saludo, nombre, categoria, asistencias, notas, totalAsistencias, estesMes,
}: {
  saludo: string; nombre: string; categoria: string;
  asistencias: Asistencia[]; notas: Nota[];
  totalAsistencias: number; estesMes: number;
}) {
  const [notaAbierta, setNotaAbierta] = useState<number | null>(null);
  const cat = CATEGORIA_COLOR[categoria] ?? CATEGORIA_COLOR["ASPIRANTE"];

  // Calcular racha simple de días consecutivos
  const hoy = new Date().toISOString().slice(0, 10);
  const fechasSet = new Set(asistencias.map(a => a.fecha));
  let racha = 0;
  let d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (fechasSet.has(key)) { racha++; d.setDate(d.getDate() - 1); }
    else break;
  }

  const asistenciaHoy = asistencias.find(a => a.fecha === hoy);

  return (
    <div className="space-y-5 pb-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{saludo}, {nombre}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
              {cat.label}
            </span>
            <span className="text-sm text-gray-400">Cía. B. V. N.° 150 — Puente Piedra</span>
          </div>
        </div>
        <Link href="/formativa/asistencia"
          className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-sm font-semibold rounded-xl hover:bg-red-800 transition-colors">
          <CalendarCheck className="w-4 h-4" />
          Marcar asistencia
        </Link>
      </div>

      {/* Estado del día */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${asistenciaHoy ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${asistenciaHoy ? "bg-green-100" : "bg-amber-100"}`}>
          <CalendarCheck className={`w-5 h-5 ${asistenciaHoy ? "text-green-600" : "text-amber-500"}`} />
        </div>
        <div className="flex-1">
          {asistenciaHoy ? (
            <>
              <p className="text-sm font-semibold text-green-800">Asistencia registrada hoy</p>
              <div className="flex items-center gap-4 mt-1 text-xs text-green-700">
                <span className="flex items-center gap-1"><LogIn className="w-3 h-3" />{formatHora(asistenciaHoy.hora_entrada)}</span>
                <span className="flex items-center gap-1"><LogOut className="w-3 h-3" />{formatHora(asistenciaHoy.hora_salida)}</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-amber-800">Aún no has registrado asistencia hoy</p>
              <p className="text-xs text-amber-600 mt-0.5">Usa el reconocimiento facial desde el cuartel</p>
            </>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total asistencias", value: totalAsistencias, icon: CheckCircle2, color: "text-blue-600" },
          { label: "Este mes",          value: estesMes,         icon: CalendarCheck, color: "text-green-600" },
          { label: "Racha actual",      value: `${racha}d`,      icon: Clock,         color: racha > 0 ? "text-purple-600" : "text-gray-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-3 py-3">
            <Icon className={`w-4 h-4 ${color} mb-1.5`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Notas de lecciones */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-700" /> Notas de lecciones
          </h2>
          <Link href="/formativa/entrenar" className="text-xs text-red-600 hover:underline">
            Registrar rostro →
          </Link>
        </div>

        {notas.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-10 text-center">
            <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aún no tienes notas registradas.</p>
            <p className="text-xs text-gray-400 mt-1">Tu instructor añadirá notas de cada lección aquí.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notas.map(nota => (
              <div key={nota.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setNotaAbierta(notaAbierta === nota.id ? null : nota.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate">{nota.titulo}</p>
                      {nota.calificacion != null && (
                        <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                          nota.calificacion >= 14 ? "bg-green-100 text-green-700" :
                          nota.calificacion >= 11 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          <Star className="w-3 h-3" />{nota.calificacion}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatFecha(nota.fecha)}</p>
                  </div>
                  {notaAbierta === nota.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                </button>
                {notaAbierta === nota.id && nota.contenido && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{nota.contenido}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de asistencias */}
      {asistencias.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 px-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-700" /> Historial de asistencias
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
            {asistencias.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="flex-1 text-sm font-medium text-gray-900">{formatFecha(a.fecha)}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><LogIn className="w-3 h-3 text-green-500" />{formatHora(a.hora_entrada)}</span>
                  <span className="flex items-center gap-1"><LogOut className="w-3 h-3 text-blue-500" />{formatHora(a.hora_salida)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
