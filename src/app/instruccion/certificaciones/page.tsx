"use client";

import { useEffect, useState } from "react";
import { Award, ChevronDown, ChevronUp, Users, CheckCircle, XCircle, AlertCircle, GraduationCap, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

interface Participante {
  bombero_id: number;
  apellidos: string;
  nombres: string;
  grado: string;
  asistio: boolean | null;
  es_instructor: boolean;
}

interface Curso {
  id: number;
  fecha: string;
  tipo: string;
  tema: string | null;
  lugar: string | null;
  entidad: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  instructor_nombre: string | null;
  instructor_grado: string | null;
  total_convocados: number;
  asistieron: number;
  no_asistieron: number;
  sin_marcar: number;
  participantes: Participante[] | null;
}

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function fmt(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function hora(h: string | null) {
  if (!h) return null;
  return h.slice(0, 5);
}

function TarjetaCurso({ curso }: { curso: Curso }) {
  const [abierto, setAbierto] = useState(false);

  const pctAsistio  = pct(curso.asistieron, curso.total_convocados);
  const colorBar    = pctAsistio >= 75 ? "bg-green-500" : pctAsistio >= 50 ? "bg-amber-400" : "bg-red-500";
  const colorBadge  = pctAsistio >= 75 ? "text-green-700 bg-green-50 border-green-200"
                    : pctAsistio >= 50 ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-red-700 bg-red-50 border-red-200";

  const instructor  = curso.participantes?.find(p => p.es_instructor);
  const asistentes  = curso.participantes?.filter(p => !p.es_instructor && p.asistio === true)  ?? [];
  const ausentes    = curso.participantes?.filter(p => !p.es_instructor && p.asistio === false) ?? [];
  const sinMarcar   = curso.participantes?.filter(p => !p.es_instructor && p.asistio === null)  ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setAbierto(a => !a)}
        className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Fecha */}
          <div className="shrink-0 text-center bg-red-50 border border-red-100 rounded-lg px-3 py-2 min-w-[56px]">
            <p className="text-[10px] text-red-400 font-semibold uppercase">
              {new Date(curso.fecha + "T00:00:00").toLocaleDateString("es-PE", { month: "short" })}
            </p>
            <p className="text-xl font-bold text-red-700 leading-tight">
              {new Date(curso.fecha + "T00:00:00").getDate()}
            </p>
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {curso.tema ?? curso.tipo}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {instructor && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <GraduationCap className="w-3 h-3 text-amber-500" />
                  {instructor.apellidos}, {instructor.nombres}
                </span>
              )}
              {curso.entidad && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  {curso.entidad}
                </span>
              )}
              {hora(curso.hora_inicio) && (
                <span className="text-xs text-gray-400">
                  {hora(curso.hora_inicio)}{hora(curso.hora_fin) ? ` – ${hora(curso.hora_fin)}` : ""}
                </span>
              )}
            </div>

            {/* Barra de asistencia */}
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${colorBar}`} style={{ width: `${pctAsistio}%` }} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${colorBadge}`}>
                {pctAsistio}%
              </span>
            </div>
          </div>

          {/* KPIs compactos */}
          <div className="shrink-0 flex items-center gap-3 text-center">
            <div>
              <p className="text-base font-bold text-green-600">{curso.asistieron}</p>
              <p className="text-[10px] text-gray-400">asistieron</p>
            </div>
            <div>
              <p className="text-base font-bold text-red-500">{curso.no_asistieron}</p>
              <p className="text-[10px] text-gray-400">ausentes</p>
            </div>
            <div>
              <p className="text-base font-bold text-gray-400">{curso.total_convocados}</p>
              <p className="text-[10px] text-gray-400">convocados</p>
            </div>
            {abierto ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
          </div>
        </div>
      </button>

      {/* Detalle expandido */}
      {abierto && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-4">
          {/* Instructor */}
          {instructor && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-semibold uppercase tracking-wide">Instructor</p>
                <p className="text-sm font-semibold text-gray-900">{instructor.apellidos}, {instructor.nombres}</p>
                {instructor.grado && <p className="text-xs text-gray-500">{instructor.grado}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Asistieron */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Asistieron ({asistentes.length})
                </p>
              </div>
              <div className="space-y-1">
                {asistentes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Ninguno</p>
                ) : asistentes.map(p => (
                  <div key={p.bombero_id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-green-100 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                    <p className="text-xs text-gray-800 truncate">{p.apellidos}, {p.nombres}</p>
                    {p.grado && <p className="text-[10px] text-gray-400 shrink-0">{p.grado}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Ausentes */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  No asistieron ({ausentes.length})
                </p>
              </div>
              <div className="space-y-1">
                {ausentes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Ninguno</p>
                ) : ausentes.map(p => (
                  <div key={p.bombero_id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-red-100 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <p className="text-xs text-gray-500 truncate line-through">{p.apellidos}, {p.nombres}</p>
                    {p.grado && <p className="text-[10px] text-gray-400 shrink-0">{p.grado}</p>}
                  </div>
                ))}
              </div>

              {/* Sin marcar */}
              {sinMarcar.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Sin registrar ({sinMarcar.length})
                    </p>
                  </div>
                  <div className="space-y-1">
                    {sinMarcar.map(p => (
                      <div key={p.bombero_id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                        <p className="text-xs text-gray-400 truncate">{p.apellidos}, {p.nombres}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CertificacionesPage() {
  const anioActual = new Date().getFullYear();
  const [anio,    setAnio]    = useState(anioActual);
  const [cursos,  setCursos]  = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/instruccion/cursos-detalle?anio=${anio}`)
      .then(r => r.json())
      .then(d => {
        setCursos(Array.isArray(d.data) ? d.data : []);
      })
      .finally(() => setLoading(false));
  }, [anio]);

  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  const totalAsistieron   = cursos.reduce((s, c) => s + c.asistieron, 0);
  const totalAusentes     = cursos.reduce((s, c) => s + c.no_asistieron, 0);
  const totalConvocados   = cursos.reduce((s, c) => s + c.total_convocados, 0);
  const pctGlobal         = pct(totalAsistieron, totalConvocados);

  return (
    <div className="space-y-5 pb-6">
      <PageHeader
        icon={Award}
        title="Asistencia a Capacitaciones"
        subtitle="Participación del personal en cursos y capacitaciones"
      />

      {/* Filtro año */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-600">Año:</label>
        <select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {anios.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      ) : cursos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center py-20 gap-2">
          <Award className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No hay capacitaciones registradas para {anio}.</p>
        </div>
      ) : (
        <>
          {/* KPIs globales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Capacitaciones",  value: cursos.length,      color: "text-gray-900",   icon: Award },
              { label: "Convocados",       value: totalConvocados,    color: "text-blue-600",   icon: Users },
              { label: "Asistieron",       value: totalAsistieron,    color: "text-green-600",  icon: CheckCircle },
              { label: "No asistieron",    value: totalAusentes,      color: "text-red-500",    icon: XCircle },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
                </div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Barra global */}
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-3 flex items-center gap-4">
            <p className="text-xs text-gray-500 shrink-0 font-medium">Asistencia global</p>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pctGlobal >= 75 ? "bg-green-500" : pctGlobal >= 50 ? "bg-amber-400" : "bg-red-500"}`}
                style={{ width: `${pctGlobal}%` }}
              />
            </div>
            <p className={`text-sm font-bold shrink-0 ${pctGlobal >= 75 ? "text-green-600" : pctGlobal >= 50 ? "text-amber-600" : "text-red-600"}`}>
              {pctGlobal}%
            </p>
          </div>

          {/* Lista de cursos */}
          <div className="space-y-3">
            {cursos.map(c => <TarjetaCurso key={c.id} curso={c} />)}
          </div>
        </>
      )}
    </div>
  );
}
