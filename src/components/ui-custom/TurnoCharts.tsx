"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

type PuntoHora = { hora: string; total: number };
type PuntoDia  = { dia: string;  total: number };

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-0.5">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mb-3">{sub}</p>}
      {children}
    </div>
  );
}

function Selector({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-red-400"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function formatSemana(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", timeZone: "UTC" });
}

function diasDeSemana(semanaIso: string): { value: string; label: string }[] {
  const base = new Date(semanaIso + "T00:00:00Z");
  const DIAS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = `${DIAS[d.getUTCDay()]} ${d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", timeZone: "UTC" })}`;
    return { value: iso, label };
  });
}

export function TurnoCharts({ anio, mes }: { anio: number; mes: number | null }) {
  const [semana,   setSemana]   = useState<string>("");
  const [dia,      setDia]      = useState<string>("");
  const [semanas,  setSemanas]  = useState<string[]>([]);
  const [porHora,  setPorHora]  = useState<PuntoHora[]>([]);
  const [porDia,   setPorDia]   = useState<PuntoDia[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Cuando cambia el mes principal, resetear filtros de semana/día
  useEffect(() => {
    setSemana("");
    setDia("");
  }, [anio, mes]);

  // Al cambiar semana, resetear día
  useEffect(() => {
    setDia("");
  }, [semana]);

  // Fetch principal
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ anio: String(anio) });
    if (mes)    params.set("mes",    String(mes));
    if (semana) params.set("semana", semana);
    if (dia)    params.set("dia",    dia);

    fetch(`/api/analisis/turno-bomberos?${params}`)
      .then(r => r.json())
      .then(d => {
        setPorHora(d.porHora ?? []);
        setPorDia(d.porDia ?? []);
        if (d.semanas?.length) setSemanas(d.semanas);
        else if (!semana) setSemanas([]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anio, mes, semana, dia]);

  const hayDatos = porHora.some(d => d.total > 0) || porDia.some(d => d.total > 0);

  // Opciones para los selectores
  const semanaOpts: { value: string; label: string }[] = [
    { value: "", label: "Todo el mes" },
    ...semanas.map(s => ({ value: s, label: `Semana del ${formatSemana(s)}` })),
  ];

  const diaOpts: { value: string; label: string }[] = semana
    ? [
        { value: "", label: "Toda la semana" },
        ...diasDeSemana(semana),
      ]
    : [];

  const subHora = dia
    ? `Bomberos en turno el ${new Date(dia + "T00:00:00Z").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" })}`
    : semana
    ? `Semana del ${formatSemana(semana)} — por hora`
    : mes
    ? "Distribución horaria del mes"
    : `Distribución horaria — ${anio}`;

  const subDia = dia
    ? null
    : semana
    ? `Días de la semana del ${formatSemana(semana)}`
    : mes
    ? "Total por día de la semana (mes)"
    : `Total por día de la semana — ${anio}`;

  return (
    <>
      {/* Filtros de semana / día — solo cuando hay mes */}
      {mes && semanas.length > 0 && (
        <div className="lg:col-span-2 flex items-center gap-4 flex-wrap px-1">
          <Selector
            label="Semana"
            value={semana}
            options={semanaOpts}
            onChange={v => setSemana(v)}
          />
          {semana && (
            <Selector
              label="Día"
              value={dia}
              options={diaOpts}
              onChange={v => setDia(v)}
            />
          )}
          {(semana || dia) && (
            <button
              onClick={() => { setSemana(""); setDia(""); }}
              className="text-[10px] text-red-500 hover:text-red-700 underline underline-offset-2"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      )}

      {/* Gráfica: por hora */}
      <Card title="Bomberos en Turno por Hora" sub={subHora}>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-400">Cargando…</div>
        ) : !hayDatos ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-400">Sin datos para el período seleccionado</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porHora} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 9, fill: "#6b7280" }} axisLine={false} tickLine={false} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v) => [`${v} bomberos`, ""]}
                />
                <Bar dataKey="total" radius={[3, 3, 0, 0]}>
                  {porHora.map((d, i) => {
                    const h = parseInt(d.hora);
                    const fill = h < 6 ? "#7c3aed" : h < 12 ? "#0891b2" : h < 18 ? "#16a34a" : "#ea580c";
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 flex-wrap">
              {[
                { color: "#7c3aed", label: "Madrugada (00–05)" },
                { color: "#0891b2", label: "Mañana (06–11)" },
                { color: "#16a34a", label: "Tarde (12–17)" },
                { color: "#ea580c", label: "Noche (18–23)" },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Gráfica: por día — se oculta si se filtró por día específico */}
      {!dia && subDia && (
        <Card title="Bomberos en Turno por Día" sub={subDia}>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-xs text-gray-400">Cargando…</div>
          ) : !hayDatos ? (
            <div className="h-48 flex items-center justify-center text-xs text-gray-400">Sin datos</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={porDia} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    formatter={(v) => [`${v} bomberos`, ""]}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {porDia.map((d, i) => {
                      // Sin semana: labels son "Dom","Lun"… — semana: labels son "lun, 27 abr."
                      // DATE_TRUNC('week') en PG empieza lunes → i=5 sáb, i=6 dom
                      const esFinDeSemana = semana
                        ? i === 5 || i === 6
                        : d.dia === "Dom" || d.dia === "Sáb";
                      return <Cell key={i} fill={esFinDeSemana ? "#dc2626" : "#16a34a"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-600" /><span className="text-[10px] text-gray-500">Semana</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-600" /><span className="text-[10px] text-gray-500">Fin de semana</span></div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
}
