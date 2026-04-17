import { prisma } from "@/lib/prisma";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default async function GuardiasPage() {
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - 3);
  const fin = new Date(hoy);
  fin.setDate(hoy.getDate() + 5);

  const guardias = await prisma.guardia.findMany({
    where: { fecha: { gte: inicio, lte: fin } },
    include: {
      bomberos: {
        include: { bombero: { select: { nombres: true, apellidos: true, grado: true } } },
      },
    },
    orderBy: [{ fecha: "asc" }, { turno: "asc" }],
  });

  const dias = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={CalendarDays}
        title="Cuadro de Guardias"
        subtitle="Turno diurno 07:00–19:00 · Turno nocturno 19:00–07:00"
      />

      <div className="space-y-2">
        {dias.map((dia) => {
          const esHoy = dia.toDateString() === hoy.toDateString();
          const guardiasDia = guardias.filter(
            (g) => new Date(g.fecha).toDateString() === dia.toDateString()
          );
          return (
            <div
              key={dia.toISOString()}
              className={`bg-white rounded-xl border overflow-hidden ${esHoy ? "border-red-700 ring-1 ring-red-700" : "border-gray-200"}`}
            >
              {/* Day header */}
              <div className={`px-5 py-2.5 flex items-center gap-3 ${esHoy ? "bg-red-700" : "bg-gray-50 border-b border-gray-200"}`}>
                <p className={`font-semibold text-sm capitalize ${esHoy ? "text-white" : "text-gray-700"}`}>
                  {dia.toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long" })}
                </p>
                {esHoy && (
                  <span className="text-xs bg-white text-red-700 font-bold px-2 py-0.5 rounded-full">
                    HOY
                  </span>
                )}
              </div>

              {/* Turnos */}
              {guardiasDia.length === 0 ? (
                <p className="px-5 py-3 text-sm text-gray-400">Sin turnos registrados</p>
              ) : (
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  {(["DIURNO", "NOCTURNO"] as const).map((turno) => {
                    const g = guardiasDia.find((x) => x.turno === turno);
                    return (
                      <div key={turno} className="px-5 py-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {turno === "DIURNO" ? "Diurno — 07:00 a 19:00 hrs" : "Nocturno — 19:00 a 07:00 hrs"}
                        </p>
                        {!g || g.bomberos.length === 0 ? (
                          <p className="text-sm text-gray-400">Sin asignación</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {g.bomberos.map((gb) => (
                              <span
                                key={gb.bomberoId}
                                className={`inline-flex items-center text-xs px-2.5 py-1 rounded-md border font-medium ${
                                  gb.asistio
                                    ? "bg-green-50 text-green-800 border-green-200"
                                    : "bg-gray-50 text-gray-600 border-gray-200"
                                }`}
                              >
                                {gb.bombero.apellidos}, {gb.bombero.nombres.split(" ")[0]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
