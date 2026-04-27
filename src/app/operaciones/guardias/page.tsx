import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

const GUARDIAS_DATA: Record<string, Record<string, { apellidos: string; nombres: string; asistio: boolean }[]>> = {
  "2026-04-14": {
    DIURNO: [
      { apellidos: "Quispe Mamani", nombres: "Carlos", asistio: true },
      { apellidos: "Torres Huanca", nombres: "Juan", asistio: true },
      { apellidos: "Chávez León", nombres: "Roberto", asistio: true },
    ],
    NOCTURNO: [
      { apellidos: "Flores Ramos", nombres: "María", asistio: true },
      { apellidos: "Paredes Cruz", nombres: "Miguel", asistio: true },
    ],
  },
  "2026-04-15": {
    DIURNO: [
      { apellidos: "Mendoza Vargas", nombres: "Ana", asistio: true },
      { apellidos: "Rojas Soto", nombres: "Lucia", asistio: true },
    ],
    NOCTURNO: [
      { apellidos: "Vega Castillo", nombres: "Sandra", asistio: true },
      { apellidos: "Salazar Pino", nombres: "Diego", asistio: false },
    ],
  },
  "2026-04-16": {
    DIURNO: [
      { apellidos: "Quispe Mamani", nombres: "Carlos", asistio: true },
      { apellidos: "Chávez León", nombres: "Roberto", asistio: true },
    ],
    NOCTURNO: [
      { apellidos: "Torres Huanca", nombres: "Juan", asistio: true },
      { apellidos: "Paredes Cruz", nombres: "Miguel", asistio: true },
      { apellidos: "Mendoza Vargas", nombres: "Ana", asistio: true },
    ],
  },
  "2026-04-17": {
    DIURNO: [
      { apellidos: "Flores Ramos", nombres: "María", asistio: true },
      { apellidos: "Rojas Soto", nombres: "Lucia", asistio: true },
      { apellidos: "Gutiérrez Mora", nombres: "Patricia", asistio: true },
    ],
    NOCTURNO: [
      { apellidos: "Vega Castillo", nombres: "Sandra", asistio: false },
      { apellidos: "Quispe Mamani", nombres: "Carlos", asistio: false },
    ],
  },
  "2026-04-18": {
    DIURNO: [
      { apellidos: "Chávez León", nombres: "Roberto", asistio: false },
      { apellidos: "Torres Huanca", nombres: "Juan", asistio: false },
    ],
    NOCTURNO: [],
  },
  "2026-04-19": { DIURNO: [], NOCTURNO: [] },
  "2026-04-20": {
    DIURNO: [
      { apellidos: "Paredes Cruz", nombres: "Miguel", asistio: false },
      { apellidos: "Mendoza Vargas", nombres: "Ana", asistio: false },
      { apellidos: "Flores Ramos", nombres: "María", asistio: false },
    ],
    NOCTURNO: [
      { apellidos: "Quispe Mamani", nombres: "Carlos", asistio: false },
    ],
  },
  "2026-04-21": {
    DIURNO: [
      { apellidos: "Rojas Soto", nombres: "Lucia", asistio: false },
    ],
    NOCTURNO: [
      { apellidos: "Torres Huanca", nombres: "Juan", asistio: false },
      { apellidos: "Chávez León", nombres: "Roberto", asistio: false },
    ],
  },
  "2026-04-22": { DIURNO: [], NOCTURNO: [] },
};

const FECHAS = [
  "2026-04-14","2026-04-15","2026-04-16","2026-04-17",
  "2026-04-18","2026-04-19","2026-04-20","2026-04-21","2026-04-22",
];

export default function GuardiasPage() {
  const hoy = new Date();

  return (
    <div className="space-y-4 pb-6">
      <PageHeader
        icon={CalendarDays}
        title="Cuadro de Guardias"
        subtitle="Turno diurno 07:00–19:00 · Turno nocturno 19:00–07:00"
      />

      <div className="space-y-2">
        {FECHAS.map((fechaStr) => {
          const dia = new Date(fechaStr + "T12:00:00");
          const esHoy = dia.toDateString() === hoy.toDateString();
          const data = GUARDIAS_DATA[fechaStr] ?? { DIURNO: [], NOCTURNO: [] };

          return (
            <div key={fechaStr} className={`bg-white rounded-xl border overflow-hidden ${esHoy ? "border-red-700 ring-1 ring-red-700" : "border-gray-200"}`}>
              <div className={`px-5 py-2.5 flex items-center gap-3 ${esHoy ? "bg-red-700" : "bg-gray-50 border-b border-gray-200"}`}>
                <p className={`font-semibold text-sm capitalize ${esHoy ? "text-white" : "text-gray-700"}`}>
                  {dia.toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
                {esHoy && <span className="text-xs bg-white text-red-700 font-bold px-2 py-0.5 rounded-full">HOY</span>}
              </div>

              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {(["DIURNO", "NOCTURNO"] as const).map((turno) => {
                  const bomberos = data[turno] ?? [];
                  return (
                    <div key={turno} className="px-5 py-3">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {turno === "DIURNO" ? "Diurno — 07:00 a 19:00 hrs" : "Nocturno — 19:00 a 07:00 hrs"}
                      </p>
                      {bomberos.length === 0 ? (
                        <p className="text-sm text-gray-400">Sin asignación</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {bomberos.map((b, i) => (
                            <span key={i} className={`inline-flex items-center text-xs px-2.5 py-1 rounded-md border font-medium ${b.asistio ? "bg-green-50 text-green-800 border-green-200" : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {b.apellidos}, {b.nombres.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
