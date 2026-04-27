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

export function RankingCard({ ranking, mes, anio, miId, miPosicion, compact }: {
  ranking: BomberoRanking[];
  mes: number;
  anio: number;
  miId?: number;
  miPosicion: number;
  compact?: boolean;
}) {
  const rows = compact ? ranking.slice(0, 5) : ranking;

  // If user is outside top-5 in compact mode, inject their row
  const miRow = miId ? ranking.find(b => b.id === miId) : undefined;
  const miEnTop = miRow && rows.some(b => b.id === miId);
  const visibleRows = compact && miRow && !miEnTop ? [...rows.slice(0, 4), miRow] : rows;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className={`px-4 ${compact ? "py-3" : "py-4"} border-b border-gray-100 flex items-center gap-2`}>
        <Trophy className="w-4 h-4 text-amber-500" />
        <div>
          <h2 className={`font-bold text-gray-900 ${compact ? "text-sm" : ""}`}>Ranking de Asistencia</h2>
          <p className="text-xs text-gray-400">{MESES_ES[mes]} {anio}</p>
        </div>
        {miPosicion > 0 && (
          <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full">
            #{miPosicion}
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {visibleRows.map((b, i) => {
          const posReal = ranking.findIndex(r => r.id === b.id) + 1;
          const meta = HORAS_REGLAMENTO[b.grado] ?? 20;
          const pct = Math.min(100, Math.round((b.horas_acumuladas / meta) * 100));
          const esYo = b.id === miId;

          return (
            <div
              key={b.id}
              className={`flex items-center gap-3 px-4 ${compact ? "py-2" : "py-3"} transition-colors ${
                esYo ? "bg-red-50 border-l-4 border-l-red-600" : "hover:bg-gray-50"
              }`}
            >
              {/* Posición */}
              <div className="w-6 text-center shrink-0">
                {posReal <= 3
                  ? <span className="text-base">{MEDALLA[posReal - 1]}</span>
                  : <span className="text-xs font-bold text-gray-300">#{posReal}</span>}
              </div>

              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                esYo ? "bg-red-600 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {b.apellidos.trim()[0]}{b.nombres[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold leading-tight truncate ${esYo ? "text-red-700" : "text-gray-900"}`}>
                  {b.apellidos.trim().split(",")[0]}, {b.nombres.split(" ")[0]}
                  {esYo && <span className="ml-1 text-[9px] font-bold bg-red-100 text-red-700 px-1 py-0.5 rounded">TÚ</span>}
                </p>
                {!compact && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400">{pct}%</span>
                  </div>
                )}
              </div>

              {/* Horas */}
              <div className="text-right shrink-0">
                <p className={`${compact ? "text-sm" : "text-base"} font-bold ${posReal === 1 ? "text-amber-500" : esYo ? "text-red-700" : "text-gray-700"}`}>
                  {b.horas_acumuladas}h
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {ranking.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-gray-400">Sin datos para este mes.</p>
      )}
    </div>
  );
}
