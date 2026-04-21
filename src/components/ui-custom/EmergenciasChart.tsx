"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface PorMes { mes: string; total: number }
interface PorTipo { name: string; value: number; color?: string }

const DEFAULT_COLORS = [
  "#dc2626","#f59e0b","#ea580c","#2563eb",
  "#7c3aed","#059669","#65a30d","#6b7280",
];

export function EmergenciasPorMesChart({ data }: { data: PorMes[] }) {
  const total = data.reduce((s, m) => s + m.total, 0);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Emergencias por Mes — {new Date().getFullYear()}</h2>
      <p className="text-xs text-gray-400 mb-4">Total: {total} atenciones</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={32}>
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

export function EmergenciasPorTipoChart({ data }: { data: PorTipo[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Distribución por Tipo</h2>
      <p className="text-xs text-gray-400 mb-2">Acumulado {new Date().getFullYear()}</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
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
