"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CapMes { mes: string; participantes: number }
interface CapRow {
  id: number;
  empresa: string;
  tema: string;
  fecha: string;
  num_participantes: number | null;
  horas: number | null;
}

interface TableProps {
  data: CapRow[];
  completadas: number;
  programadas: number;
  totalParticipantes: number;
}

export function CapacitacionesChart({ data }: { data: CapMes[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Capacitaciones a Empresas — {new Date().getFullYear()}</h2>
      <p className="text-xs text-gray-400 mb-4">Participantes por mes</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} cursor={{ fill: "#f9fafb" }} />
          <Bar dataKey="participantes" fill="#2563eb" radius={[4, 4, 0, 0]} name="Participantes" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CapacitacionesTable({ data, completadas, programadas, totalParticipantes }: TableProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Completadas</p>
          <p className="text-2xl font-bold text-green-800 mt-0.5">{completadas}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Programadas</p>
          <p className="text-2xl font-bold text-blue-800 mt-0.5">{programadas}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">Participantes</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{totalParticipantes}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">Registro de Capacitaciones</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Empresa", "Tema", "Fecha", "Participantes", "Horas", "Estado"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((c) => {
                const estado = c.fecha <= today ? "COMPLETADO" : "PROGRAMADO";
                const badge = estado === "COMPLETADO"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-blue-100 text-blue-800 border-blue-200";
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{c.empresa}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{c.tema}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(c.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{c.num_participantes ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.horas != null ? `${c.horas}h` : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${badge}`}>
                        {estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
