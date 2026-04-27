"use client";

import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface VehiculoChart { estado: string; count: number }
interface PersonalChart  { name: string; value: number; color: string }
interface RolChart        { rol: string; total: number }

const COLOR_VEHICULO: Record<string, string> = {
  "Operativo":         "#16a34a",
  "Con desperfectos":  "#d97706",
  "En emergencia":     "#2563eb",
  "Fuera de servicio": "#dc2626",
};

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/* ── Donut flota ── */
export function VehiculosDonut({ vehiculos, compact = false }: { vehiculos: VehiculoChart[]; compact?: boolean }) {
  const mounted = useMounted();
  const data  = vehiculos.map(v => ({ name: v.estado, value: v.count, color: COLOR_VEHICULO[v.estado] ?? "#6b7280" }));
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className={compact ? "" : "bg-white rounded-xl border border-gray-200 p-4 flex flex-col"}>
      {!compact && (
        <>
          <p className="text-sm font-semibold text-gray-900 mb-0.5">Estado de Flota</p>
          <p className="text-xs text-gray-400 mb-2">{total} unidades registradas</p>
        </>
      )}
      <div style={{ height: compact ? 110 : 170 }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius="38%" outerRadius="65%" paddingAngle={3} dataKey="value">
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                formatter={(v) => [`${v} unidad${Number(v) !== 1 ? "es" : ""}`, ""]} />
              <Legend iconType="circle" iconSize={7}
                formatter={(v) => <span style={{ fontSize: 10, color: "#374151" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ── Donut composición del turno ── */
export function PersonalDonut({ personal }: { personal: PersonalChart[] }) {
  const mounted = useMounted();
  const total = personal.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <p className="text-sm font-semibold text-gray-900 mb-0.5">Composición del Turno</p>
      <p className="text-xs text-gray-400 mb-2">{total} efectivos presentes</p>
      <div style={{ height: 170 }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <PieChart>
              <Pie data={personal} cx="50%" cy="50%" innerRadius="38%" outerRadius="65%" paddingAngle={3} dataKey="value">
                {personal.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                formatter={(v) => [`${v}`, ""]} />
              <Legend iconType="circle" iconSize={7}
                formatter={(v) => <span style={{ fontSize: 10, color: "#374151" }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ── Barras roles especiales ── */
export function RolesBar({ roles }: { roles: RolChart[] }) {
  const mounted = useMounted();
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col">
      <p className="text-sm font-semibold text-gray-900 mb-0.5">Especialidades en Turno</p>
      <p className="text-xs text-gray-400 mb-2">Roles activos</p>
      <div style={{ height: 170 }}>
        {mounted && (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <BarChart data={roles} barSize={24} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="rol" type="category" width={52}
                tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v) => [`${v}`, "Efectivos"]} />
              <Bar dataKey="total" fill="#b91c1c" radius={[0, 4, 4, 0]} name="Efectivos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
