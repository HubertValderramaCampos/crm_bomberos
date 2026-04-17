"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";

const asistenciaMensual = [
  { mes: "Ene", pct: 88 },
  { mes: "Feb", pct: 91 },
  { mes: "Mar", pct: 85 },
  { mes: "Abr", pct: 93 },
];

const asistenciaEfectivos = [
  { nombre: "Zamudio Lara, Christian", grado: "Brigadier",          guardias: 12, asistencias: 12, pct: 100 },
  { nombre: "Quispe Mamani, Carlos",   grado: "Capitán",            guardias: 12, asistencias: 11, pct: 92  },
  { nombre: "Flores Ramos, María",     grado: "Teniente",           guardias: 12, asistencias: 11, pct: 92  },
  { nombre: "Torres Huanca, Juan",     grado: "Teniente",           guardias: 12, asistencias: 10, pct: 83  },
  { nombre: "Paredes Cruz, Miguel",    grado: "Capitán",            guardias: 12, asistencias: 12, pct: 100 },
  { nombre: "Mendoza Vargas, Ana",     grado: "Sub Teniente",       guardias: 12, asistencias: 9,  pct: 75  },
  { nombre: "Rojas Soto, Lucia",       grado: "Seccionario",        guardias: 12, asistencias: 10, pct: 83  },
  { nombre: "Vega Castillo, Sandra",   grado: "Teniente Brigadier", guardias: 12, asistencias: 11, pct: 92  },
  { nombre: "Chávez León, Roberto",    grado: "Seccionario",        guardias: 12, asistencias: 8,  pct: 67  },
  { nombre: "Gutiérrez Mora, Patricia", grado: "Sub Teniente",      guardias: 12, asistencias: 10, pct: 83  },
];

export function AsistenciaMensualChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Asistencia a Guardias — 2026</h2>
      <p className="text-xs text-gray-400 mb-4">Porcentaje mensual de efectivos presentes</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={asistenciaMensual}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(v) => [`${v}%`, "Asistencia"]}
          />
          <Line type="monotone" dataKey="pct" stroke="#b91c1c" strokeWidth={2} dot={{ fill: "#b91c1c", r: 4 }} name="Asistencia" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AsistenciaEfectivosTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Asistencia por Efectivo — Abril 2026</h2>
        <p className="text-xs text-gray-400 mt-0.5">12 guardias programadas en el mes</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Efectivo", "Grado", "Asistencias", "% Cumplimiento"].map((h) => (
                <th key={h} className="text-left px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {asistenciaEfectivos.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900">{e.nombre}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{e.grado}</td>
                <td className="px-5 py-3 text-gray-700">
                  <span className="font-bold">{e.asistencias}</span>
                  <span className="text-gray-400 text-xs"> / {e.guardias}</span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className={`h-2 rounded-full ${e.pct >= 90 ? "bg-green-500" : e.pct >= 75 ? "bg-amber-400" : "bg-red-500"}`}
                        style={{ width: `${e.pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${e.pct >= 90 ? "text-green-700" : e.pct >= 75 ? "text-amber-700" : "text-red-700"}`}>
                      {e.pct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AsistenciaPorGradoChart() {
  const porGrado = [
    { grado: "Brigadier",          pct: 100 },
    { grado: "Tte. Brigadier",     pct: 92  },
    { grado: "Capitán",            pct: 96  },
    { grado: "Teniente",           pct: 88  },
    { grado: "Sub Teniente",       pct: 79  },
    { grado: "Seccionario",        pct: 75  },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-1">Asistencia por Grado</h2>
      <p className="text-xs text-gray-400 mb-4">Promedio acumulado 2026</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={porGrado} layout="vertical" barSize={18}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} unit="%" />
          <YAxis dataKey="grado" type="category" tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} width={100} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            formatter={(v) => [`${v}%`, "Asistencia"]}
          />
          <Bar dataKey="pct" fill="#1d4ed8" radius={[0, 4, 4, 0]} name="Asistencia" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
