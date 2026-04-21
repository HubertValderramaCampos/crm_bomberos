"use client";
import { HORAS_REGLAMENTO } from "@/lib/reglamento";
import { Trophy } from "lucide-react";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const MEDALLA = ["🥇","🥈","🥉"];

interface BomberoRanking {
  id: number;
  apellidos: string;
  nombres: string;
  grado: string;
  codigo: string;
  horas_acumuladas: number;
  dias_asistidos: number;
  num_emergencias: number;
}

export function RankingCard({ ranking, mes, anio, miId, miPosicion }: {
  ranking: BomberoRanking[];
  mes: number;
  anio: number;
  miId?: number;
  miPosicion: number;
}) {
  const top = ranking[0]?.horas_acumuladas ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-500" />
        <div>
          <h2 className="font-bold text-gray-900">Ranking de Asistencia</h2>
          <p className="text-xs text-gray-400">{MESES_ES[mes]} {anio} — top horas acumuladas</p>
        </div>
        {miPosicion > 0 && (
          <span className="ml-auto text-xs font-semibold px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full">
            Tu posición: #{miPosicion}
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {ranking.map((b, i) => {
          const meta = HORAS_REGLAMENTO[b.grado] ?? 20;
          const pct = Math.min(100, Math.round((b.horas_acumuladas / meta) * 100));
          const esYo = b.id === miId;

          return (
            <div
              key={b.id}
              className={`flex items-center gap-4 px-5 py-3 transition-colors ${
                esYo ? "bg-red-50 border-l-4 border-l-red-600" : "hover:bg-gray-50"
              }`}
            >
              {/* Posición */}
              <div className="w-8 text-center shrink-0">
                {i < 3
                  ? <span className="text-xl">{MEDALLA[i]}</span>
                  : <span className="text-sm font-bold text-gray-300">#{i + 1}</span>}
              </div>

              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                esYo ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {b.apellidos.trim()[0]}{b.nombres[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold leading-tight truncate ${esYo ? "text-red-700" : "text-gray-900"}`}>
                    {b.apellidos.trim()}, {b.nombres}
                    {esYo && <span className="ml-1 text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">TÚ</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{pct}% meta</span>
                  <span className="text-[10px] text-gray-400">{b.dias_asistidos}d · {b.num_emergencias} emerg.</span>
                </div>
              </div>

              {/* Horas */}
              <div className="text-right shrink-0">
                <p className={`text-lg font-bold ${i === 0 ? "text-amber-500" : esYo ? "text-red-700" : "text-gray-800"}`}>
                  {b.horas_acumuladas}h
                </p>
                <p className="text-[10px] text-gray-400">de {meta}h</p>
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-gray-400">Sin datos para este mes.</p>
      )}
    </div>
  );
}
