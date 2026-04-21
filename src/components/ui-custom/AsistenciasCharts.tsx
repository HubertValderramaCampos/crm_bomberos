"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line, ComposedChart, Area,
} from "recharts";

interface Props {
  resumenMeses: { label: string; mes: number; anio: number; bomberos: number; promHoras: number; totalHoras: number }[];
  porGrado:     { grado: string; total: number; promHoras: number }[];
  cumplimiento: { grado: string; cumple: number; noCumple: number; total: number }[];
  topBomberos:  { nombre: string; horas: number; dias: number }[];
  mesActual:    number;
  anioActual:   number;
}

const COLORES = ["#b91c1c","#d97706","#2563eb","#059669","#7c3aed","#0891b2","#65a30d","#6b7280"];

function Card({ title, sub, children, full }: { title: string; sub?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${full ? "lg:col-span-2" : ""}`}>
      <h2 className="font-semibold text-gray-900 mb-0.5">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mb-4">{sub}</p>}
      {children}
    </div>
  );
}

export function AsistenciasCharts({ resumenMeses, porGrado, cumplimiento, topBomberos, mesActual, anioActual }: Props) {
  // Invertir para mostrar cronológicamente
  const mesesCrono = [...resumenMeses].reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* 1. Evolución de horas y bomberos por mes */}
      <Card title="Evolución de Horas Mensuales" sub="Total de horas acumuladas por la compañía" full>
        <ResponsiveContainer width="100%" height={210}>
          <ComposedChart data={mesesCrono}>
            <defs>
              <linearGradient id="gradHoras" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#b91c1c" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="horas" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="prom" orientation="right" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(v, name) => [name === "Total horas" ? `${v}h` : `${v}h prom.`, name]} />
            <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>} />
            <Area yAxisId="horas" type="monotone" dataKey="totalHoras" name="Total horas" fill="url(#gradHoras)" stroke="none" />
            <Line yAxisId="horas" type="monotone" dataKey="totalHoras" name="Total horas" stroke="#b91c1c" strokeWidth={2} dot={{ r: 4, fill: "#b91c1c" }} />
            <Line yAxisId="prom"  type="monotone" dataKey="promHoras"  name="Prom. x bombero" stroke="#2563eb" strokeWidth={2} strokeDasharray="4 3" dot={{ r: 3, fill: "#2563eb" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* 2. Top 10 bomberos del mes */}
      <Card title="Top 10 Bomberos" sub={`Mayor asistencia — ${mesActual}/${anioActual}`}>
        {topBomberos.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Sin datos.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, topBomberos.length * 34)}>
            <BarChart data={topBomberos} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} unit="h" />
              <YAxis dataKey="nombre" type="category" width={130}
                tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v, _, p) => [`${v}h · ${p.payload.dias} días`, ""]}
              />
              <Bar dataKey="horas" name="Horas" radius={[0, 5, 5, 0]}>
                {topBomberos.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#b91c1c" : i === 1 ? "#d97706" : i === 2 ? "#2563eb" : "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 3. Promedio de horas por grado */}
      <Card title="Promedio de Horas por Grado" sub="Horas promedio en el mes seleccionado">
        {porGrado.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Sin datos.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(180, porGrado.length * 48)}>
            <BarChart data={porGrado} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} unit="h" />
              <YAxis dataKey="grado" type="category" width={130}
                tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v, _, p) => [`${v}h prom. · ${p.payload.total} bomberos`, ""]}
              />
              <Bar dataKey="promHoras" name="Prom. horas" radius={[0, 5, 5, 0]}>
                {porGrado.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 4. Cumplimiento reglamentario por grado */}
      <Card title="Cumplimiento Reglamentario" sub="Bomberos que alcanzan las horas mínimas por grado">
        {cumplimiento.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">Sin datos.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(180, cumplimiento.length * 48)}>
              <BarChart data={cumplimiento} layout="vertical" barSize={22} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="grado" type="category" width={130}
                  tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v, name) => [`${v} bomberos`, name]}
                />
                <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>} />
                <Bar dataKey="cumple"   name="Cumple"    stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                <Bar dataKey="noCumple" name="No cumple" stackId="a" fill="#fca5a5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-gray-400 mt-3">
              * Mínimos: Seccionario 30h · SubTeniente/Teniente 20h · Capitán 10h · Tnte Brigadier 5h · Brigadier 1h
            </p>
          </>
        )}
      </Card>

    </div>
  );
}
