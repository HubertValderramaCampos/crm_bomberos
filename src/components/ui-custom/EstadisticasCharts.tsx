"use client";

import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  ComposedChart, Area,
} from "recharts";

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface Props {
  dias:             { dia: string; total: number }[];
  categorias:       { categoria: string; total: number }[];
  respuesta:        { categoria: string; mins: number; total: number }[];
  vehiculos:        { codigo: string; tipo: string; total: number }[];
  mando:            { nombre: string; veces: number }[];
  tendenciaMensual: { mes: string; total: number; cerradas: number }[];
  anio:             number;
  mes:              number | null;
}

const COLORES_CAT = ["#b91c1c","#d97706","#2563eb","#059669","#7c3aed","#0891b2","#65a30d","#6b7280"];

function abrev(s: string, max = 18) {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function abrevNombre(s: string) {
  const partes = s.split(" ");
  return abrev(partes.slice(partes.length >= 3 ? 2 : 1).join(" "), 20);
}

function Card({ title, sub, children, full }: { title: string; sub?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${full ? "lg:col-span-2" : ""}`}>
      <h2 className="font-semibold text-gray-900 mb-0.5">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mb-4">{sub}</p>}
      {children}
    </div>
  );
}

export function EstadisticasCharts({ dias, categorias, respuesta, vehiculos, mando, tendenciaMensual, anio, mes }: Props) {
  const periodo = mes ? `${MESES_ES[mes]} ${anio}` : `${anio}`;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* 1. Actividad diaria */}
      <Card title="Actividad Diaria" sub={mes ? `Emergencias día a día — ${periodo}` : "Emergencias atendidas en los últimos 60 días"} full>
        {dias.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Sin datos en el período.</p>
        ) : (
          <ResponsiveContainer width="100%" height={190}>
            <ComposedChart data={dias}>
              <defs>
                <linearGradient id="gradDias" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#b91c1c" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                axisLine={false} tickLine={false}
                tickFormatter={v => new Date(v + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                interval="preserveStartEnd"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                labelFormatter={v => new Date(v + "T12:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "long" })}
                formatter={(v) => [v, "Emergencias"]}
              />
              <Area type="monotone" dataKey="total" fill="url(#gradDias)" stroke="none" />
              <Line type="monotone" dataKey="total" stroke="#b91c1c" strokeWidth={2}
                dot={false} activeDot={{ r: 5, fill: "#b91c1c" }} name="Emergencias" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 2. Tendencia mensual — barras agrupadas (ancho completo) */}
      {tendenciaMensual.length > 0 && (
        <Card title="Tendencia Mensual" sub={`Total vs cerradas por mes — ${anio}`} full>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tendenciaMensual} barGap={3} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>} />
              <Bar dataKey="total"   name="Total"   fill="#fca5a5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cerradas" name="Cerradas" fill="#b91c1c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* 3. Distribución por categoría — donut */}
      <Card title="Distribución por Categoría" sub={`Composición — ${periodo}`}>
        {categorias.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Sin datos.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categorias} dataKey="total" nameKey="categoria"
                cx="50%" cy="50%" innerRadius="38%" outerRadius="68%" paddingAngle={2}
                label={false} labelLine={false}>
                {categorias.map((_, i) => <Cell key={i} fill={COLORES_CAT[i % COLORES_CAT.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
                formatter={(v, name) => [`${v} emergencias`, name]}
              />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ fontSize: 10, color: "#374151" }}>{abrev(v, 24)}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 4. Tiempo de respuesta por categoría — barras horizontales */}
      <Card title="Tiempo de Respuesta" sub="Minutos promedio despacho → llegada (mín. 2 casos)">
        {respuesta.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Sin datos suficientes.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, respuesta.length * 50)}>
            <BarChart data={respuesta} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} unit=" min" />
              <YAxis dataKey="categoria" type="category" width={120}
                tick={{ fontSize: 10, fill: "#374151" }} axisLine={false} tickLine={false}
                tickFormatter={v => abrev(v, 16)} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v, _, p) => [`${v} min · ${p.payload.total} casos`, "Promedio"]}
              />
              <Bar dataKey="mins" fill="#2563eb" radius={[0, 5, 5, 0]} name="Minutos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 5. Uso de unidades — barras verticales */}
      <Card title="Uso de Unidades" sub={`Salidas por vehículo — ${periodo}`}>
        {vehiculos.filter(v => v.total > 0).length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Sin datos.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={vehiculos.filter(v => v.total > 0)} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="codigo" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v, _, p) => [`${v} salidas`, p.payload.tipo]}
              />
              <Bar dataKey="total" radius={[5, 5, 0, 0]} name="Salidas">
                {vehiculos.filter(v => v.total > 0).map((_, i) => (
                  <Cell key={i} fill={["#059669","#0891b2","#7c3aed","#d97706","#b91c1c","#6b7280"][i % 6]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* 6. Efectivos al mando — próximamente */}
      <Card title="Efectivos al Mando" sub="Disponible en la próxima versión del sistema">
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <span className="text-3xl">🔒</span>
          <p className="text-sm font-semibold text-gray-500">Próximamente — Nivel 2</p>
          <p className="text-xs text-gray-400 text-center max-w-xs">
            El ranking de efectivos al mando estará disponible en la siguiente versión del sistema.
          </p>
        </div>
      </Card>

    </div>
  );
}
