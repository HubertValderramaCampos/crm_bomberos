"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

const capacitaciones = [
  { id: "1", empresa: "Corporación Aceros Arequipa", tipo: "Brigada contra incendios", fecha: "2026-03-15", participantes: 24, duracion: 8,  estado: "COMPLETADO" },
  { id: "2", empresa: "Municipalidad de Puente Piedra", tipo: "Evacuación y emergencias", fecha: "2026-03-28", participantes: 40, duracion: 4, estado: "COMPLETADO" },
  { id: "3", empresa: "Colegio San José Obrero",       tipo: "Primeros auxilios básicos", fecha: "2026-04-05", participantes: 35, duracion: 6, estado: "COMPLETADO" },
  { id: "4", empresa: "Planta industrial Lima Norte",  tipo: "HAZMAT – Materiales peligrosos", fecha: "2026-04-22", participantes: 18, duracion: 16, estado: "PROGRAMADO" },
  { id: "5", empresa: "Supermercado Plaza Vea Puente Piedra", tipo: "Evacuación y uso de extintores", fecha: "2026-04-29", participantes: 22, duracion: 4, estado: "PROGRAMADO" },
  { id: "6", empresa: "Empresa constructora CVC SAC",  tipo: "Seguridad en obra – incendios", fecha: "2026-05-10", participantes: 30, duracion: 8, estado: "PROGRAMADO" },
];

const porMes = [
  { mes: "Ene", capacitaciones: 1, participantes: 28 },
  { mes: "Feb", capacitaciones: 2, participantes: 45 },
  { mes: "Mar", capacitaciones: 2, participantes: 64 },
  { mes: "Abr", capacitaciones: 3, participantes: 75 },
];

const ESTADO_COLOR: Record<string, string> = {
  COMPLETADO: "bg-green-100 text-green-800 border-green-200",
  PROGRAMADO: "bg-blue-100 text-blue-800 border-blue-200",
  CANCELADO:  "bg-red-100 text-red-800 border-red-200",
};

export function CapacitacionesChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Capacitaciones a Empresas — 2026</h2>
      <p className="text-xs text-gray-400 mb-4">Participantes por mes</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={porMes} barSize={28}>
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

export function CapacitacionesTable() {
  const completadas = capacitaciones.filter((c) => c.estado === "COMPLETADO").length;
  const programadas = capacitaciones.filter((c) => c.estado === "PROGRAMADO").length;
  const totalParticipantes = capacitaciones.filter((c) => c.estado === "COMPLETADO").reduce((s, c) => s + c.participantes, 0);

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
                {["Empresa", "Tipo de Capacitación", "Fecha", "Participantes", "Horas", "Estado"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {capacitaciones.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">{c.empresa}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-[160px] truncate">{c.tipo}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(c.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-semibold">{c.participantes}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.duracion}h</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${ESTADO_COLOR[c.estado] ?? ""}`}>
                      {c.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
