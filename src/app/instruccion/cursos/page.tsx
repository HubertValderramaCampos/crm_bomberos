"use client";

import { useEffect, useState } from "react";
import { BookOpen, Trophy, Medal, Award } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

interface Instructor {
  id: number;
  apellidos: string;
  nombres: string;
  grado: string;
  codigo: string;
  total_capacitaciones: number;
  ultima_fecha: string | null;
}

function rankIcon(pos: number) {
  if (pos === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
  if (pos === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (pos === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-semibold text-gray-400 w-5 text-center">{pos}</span>;
}

export default function CursosPage() {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(anioActual);
  const [data, setData] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sintetico, setSintetico] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/instruccion/ranking-instructores?anio=${anio}`)
      .then(r => r.json())
      .then(d => {
        setData(Array.isArray(d.data) ? d.data : []);
        setSintetico(d.sintetico ?? false);
      })
      .finally(() => setLoading(false));
  }, [anio]);

  const anios = Array.from({ length: 5 }, (_, i) => anioActual - i);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookOpen}
        title="Ranking de Instructores"
        subtitle="Efectivos que más han dictado capacitaciones"
      />

      {/* Filtro año */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-medium text-gray-600">Año:</label>
        <select
          value={anio}
          onChange={e => setAnio(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          {anios.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        {sintetico && (
          <span className="text-xs px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded-full font-medium">
            Datos de muestra — aún no hay instructores registrados para {anio}
          </span>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <BookOpen className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400">Sin data para {anio}.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Efectivo</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacitaciones dictadas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Última fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((item, idx) => (
                <tr key={item.id} className={idx < 3 ? "bg-yellow-50/30" : "hover:bg-gray-50"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {rankIcon(idx + 1)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {item.apellidos}, {item.nombres}
                    </p>
                    <p className="text-xs text-gray-500">{item.grado} · {item.codigo}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-base font-bold ${
                      idx === 0 ? "bg-yellow-100 text-yellow-700" :
                      idx === 1 ? "bg-gray-100 text-gray-600" :
                      idx === 2 ? "bg-amber-100 text-amber-700" :
                      "bg-blue-50 text-blue-600"
                    }`}>
                      {item.total_capacitaciones}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {item.ultima_fecha
                      ? new Date(item.ultima_fecha + "T00:00:00").toLocaleDateString("es-PE", {
                          day: "2-digit", month: "short", year: "numeric"
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
