"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";

interface MesData { mes: string; total: number }
interface EfectivoData { nombre: string; grado: string; asistencias: number }
interface GradoData { grado: string; total: number }

export function AsistenciaMensualChart({ data }: { data: MesData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Asistencia a Guardias — {new Date().getFullYear()}</h2>
      <p className="text-xs text-gray-400 mb-4">Efectivos presentes por mes</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(v) => [`${v} efectivos`, "Asistencia"]}
          />
          <Line type="monotone" dataKey="total" stroke="#b91c1c" strokeWidth={2} dot={{ fill: "#b91c1c", r: 4 }} name="Efectivos" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AsistenciaEfectivosTable({ data }: { data: EfectivoData[] }) {
  const mes = new Date().toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Asistencia por Efectivo — {mes}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{data.length} efectivos activos</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Efectivo", "Grado", "Asistencias"].map((h) => (
                <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{e.nombre}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{e.grado}</td>
                <td className="px-5 py-3 text-gray-700 font-bold">{e.asistencias}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AsistenciaPorGradoChart({ data }: { data: GradoData[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Asistencia por Grado</h2>
      <p className="text-xs text-gray-400 mb-4">Efectivos presentes este mes</p>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 36)}>
        <BarChart data={data} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis dataKey="grado" type="category" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={110} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(v) => [`${v} efectivos`, "Asistencia"]}
          />
          <Bar dataKey="total" fill="#1d4ed8" radius={[0, 4, 4, 0]} name="Efectivos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
