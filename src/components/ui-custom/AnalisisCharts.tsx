"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORES_DISTRITO = ["#dc2626","#ea580c","#d97706","#65a30d","#0891b2","#7c3aed","#db2777","#475569","#16a34a","#0284c7","#9333ea"];
const COLORES_CATEGORIA: Record<string, string> = {
  "INCENDIO":              "#dc2626",
  "EMERGENCIA MEDICA":     "#3b82f6",
  "ACCIDENTE VEHICULAR":   "#f59e0b",
  "MATERIALES PELIGROSOS": "#8b5cf6",
  "RESCATE":               "#10b981",
  "COMISION":              "#6b7280",
  "FALSA ALARMA":          "#94a3b8",
};
const COLOR_DEFAULT = "#64748b";

function categoriaColor(cat: string) {
  return COLORES_CATEGORIA[cat] ?? COLOR_DEFAULT;
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

function CustomTooltipDescripcion({ active, payload }: { active?: boolean; payload?: { payload: { descripcion: string; total: number } }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-2 shadow text-xs max-w-xs">
      <p className="font-medium text-gray-800 mb-1">{d.descripcion}</p>
      <p className="text-gray-500">{d.total} emergencias</p>
    </div>
  );
}

export function AnalisisCharts({
  distritos, tiposDesc, tiposGrupo, vehiculos, tiempoXTipo,
  porHora, porDia, mesesData, categorias, anio, mes,
}: {
  distritos:   { nombre: string; total: number }[];
  tiposDesc:   { descripcion: string; total: number }[];
  tiposGrupo:  { categoria: string; total: number }[];
  vehiculos:   { codigo: string; tipo: string; total: number }[];
  tiempoXTipo: { descripcion: string; mins: number; total: number }[];
  porHora:     { hora: string; total: number }[];
  porDia:      { dia: string; total: number }[];
  mesesData:   Record<string, number | string>[];
  categorias:  string[];
  anio:        number;
  mes:         number | null;
}) {
  // Truncate largo para el eje Y
  const tiposDescTrunc = tiposDesc.map(d => ({
    ...d,
    label: d.descripcion.length > 38 ? d.descripcion.slice(0, 36) + "…" : d.descripcion,
  }));

  const vehiculosActivos = vehiculos.filter(v => v.total > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* 1. Por distrito */}
      <Card title="Por Distrito" sub={`Distribución geográfica — ${anio}`}>
        <ResponsiveContainer width="100%" height={Math.max(200, distritos.length * 36)}>
          <BarChart data={distritos} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis dataKey="nombre" type="category" width={150} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(v) => [`${v} emergencias`, ""]}
            />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {distritos.map((_, i) => (
                <Cell key={i} fill={COLORES_DISTRITO[i % COLORES_DISTRITO.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 2. Por categoría — donut */}
      <Card title="Por Categoría" sub={`Agrupación por tipo principal — ${anio}`}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={tiposGrupo}
              dataKey="total"
              nameKey="categoria"
              cx="50%" cy="50%"
              innerRadius={65} outerRadius={100}
              paddingAngle={3}
              label={false}
              labelLine={false}
            >
              {tiposGrupo.map((t, i) => (
                <Cell key={i} fill={categoriaColor(t.categoria)} />
              ))}
            </Pie>
            <Legend
              formatter={(value) => <span style={{ fontSize: 11, color: "#374151" }}>{value}</span>}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(v, name) => [`${v} partes`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* 3. Top 10 tipos por descripción completa */}
      <Card title="Top 10 Tipos de Emergencia" sub="Por descripción completa del tipo" full>
        <ResponsiveContainer width="100%" height={Math.max(260, tiposDescTrunc.length * 38)}>
          <BarChart data={tiposDescTrunc} layout="vertical" barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis
              dataKey="label"
              type="category"
              width={260}
              tick={{ fontSize: 10, fill: "#374151" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltipDescripcion />} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]}>
              {tiposDescTrunc.map((d, i) => {
                const cat = d.descripcion.split(" / ")[0];
                return <Cell key={i} fill={categoriaColor(cat)} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 4. Uso de vehículos */}
      {vehiculosActivos.length > 0 && (
        <Card title="Salidas por Vehículo" sub={`Cantidad de emergencias atendidas — ${anio}`}>
          <ResponsiveContainer width="100%" height={Math.max(160, vehiculosActivos.length * 44)}>
            <BarChart data={vehiculosActivos} layout="vertical" barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="codigo"
                type="category"
                width={90}
                tick={{ fontSize: 11, fill: "#374151" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                formatter={(v, _name, props) => [`${v} salidas`, props.payload.tipo]}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {vehiculosActivos.map((v, i) => (
                  <Cell key={i} fill={COLORES_DISTRITO[i % COLORES_DISTRITO.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* 5. Por hora del día */}
      <Card title="Por Hora del Día" sub="¿A qué hora ocurren más emergencias?">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={porHora} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="hora"
              tick={{ fontSize: 9, fill: "#6b7280" }}
              axisLine={false} tickLine={false}
              interval={2}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(v) => [`${v} emergencias`, ""]}
            />
            <Bar dataKey="total" radius={[3, 3, 0, 0]}>
              {porHora.map((d, i) => {
                const h = parseInt(d.hora);
                const fill = h < 6 ? "#7c3aed" : h < 12 ? "#0891b2" : h < 18 ? "#dc2626" : "#ea580c";
                return <Cell key={i} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 flex-wrap">
          {[
            { color: "#7c3aed", label: "Madrugada (00–05)" },
            { color: "#0891b2", label: "Mañana (06–11)" },
            { color: "#dc2626", label: "Tarde (12–17)" },
            { color: "#ea580c", label: "Noche (18–23)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Por día de la semana */}
      <Card title="Por Día de la Semana" sub="¿Qué días hay más actividad?">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={porDia} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "#374151" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(v) => [`${v} emergencias`, ""]}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {porDia.map((d, i) => (
                <Cell key={i} fill={d.dia === "Dom" || d.dia === "Sáb" ? "#dc2626" : "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /><span className="text-[10px] text-gray-500">Semana</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-600" /><span className="text-[10px] text-gray-500">Fin de semana</span></div>
        </div>
      </Card>

      {/* 7. Tiempo de respuesta por tipo (top 8) */}
      {tiempoXTipo.length > 0 && (
        <Card title="Tiempo de Respuesta por Tipo" sub="Minutos promedio despacho → llegada (mín. 2 partes)" full>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-2">
            {tiempoXTipo.map(({ descripcion, mins, total }) => {
              const cat = descripcion.split(" / ")[0];
              const color = categoriaColor(cat);
              const pct = Math.min(100, (mins / Math.max(...tiempoXTipo.map(t => t.mins))) * 100);
              const label = descripcion.length > 42 ? descripcion.slice(0, 40) + "…" : descripcion;
              return (
                <div key={descripcion}>
                  <div className="flex justify-between mb-1 gap-2">
                    <span className="text-xs text-gray-700 leading-tight flex-1 min-w-0" title={descripcion}>{label}</span>
                    <span className="text-xs font-bold shrink-0" style={{ color }}>{mins} min</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">{total} partes con datos</p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-4">* Solo partes con fecha de despacho y llegada registradas</p>
        </Card>
      )}

      {/* 8. Evolución mensual por categoría — solo si no hay filtro de mes */}
      {!mes && mesesData.length > 0 && (
        <Card title="Evolución Mensual por Categoría" sub={`Composición mes a mes — ${anio}`} full>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mesesData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>} />
              {categorias.map((cat, i) => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="a"
                  fill={categoriaColor(cat)}
                  radius={i === categorias.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

    </div>
  );
}
