"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const porMes = [
  { mes: "Ene", total: 18 },
  { mes: "Feb", total: 22 },
  { mes: "Mar", total: 31 },
  { mes: "Abr", total: 27 },
];

const porTipo = [
  { name: "Emergencia Médica",    value: 38, color: "#dc2626" },
  { name: "Accidente Vehicular",  value: 21, color: "#f59e0b" },
  { name: "Incendio Urbano",      value: 12, color: "#ea580c" },
  { name: "Rescate",              value: 9,  color: "#2563eb" },
  { name: "Mat. Peligrosos",      value: 6,  color: "#7c3aed" },
  { name: "Servicio Especial",    value: 5,  color: "#059669" },
  { name: "Incendio Forestal",    value: 4,  color: "#65a30d" },
  { name: "Otros",                value: 3,  color: "#6b7280" },
];

export function EmergenciasPorMesChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Emergencias por Mes — 2026</h2>
      <p className="text-xs text-gray-400 mb-4">Total: {porMes.reduce((s, m) => s + m.total, 0)} atenciones</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={porMes} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            cursor={{ fill: "#f9fafb" }}
          />
          <Bar dataKey="total" fill="#b91c1c" radius={[4, 4, 0, 0]} name="Emergencias" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function EmergenciasPorTipoChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Distribución por Tipo</h2>
      <p className="text-xs text-gray-400 mb-2">Acumulado 2026</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={porTipo}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {porTipo.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(v) => [`${v} casos`, ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
