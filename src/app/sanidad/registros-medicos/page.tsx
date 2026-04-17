import { prisma } from "@/lib/prisma";
import { HeartPulse, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatCard } from "@/components/ui-custom/StatCard";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const GRADO_LABELS: Record<string, string> = {
  BOMBERO_RASO: "Bro. Raso", BOMBERO_PRIMERO: "Bro. 1.°", CABO: "Cabo",
  SARGENTO_SEGUNDO: "Sgto. 2.°", SARGENTO_PRIMERO: "Sgto. 1.°", ALFEREZ: "Alférez",
  TENIENTE: "Tte.", CAPITAN: "Cap.", MAYOR: "My.", CORONEL: "Crnl.",
};

export default async function RegistrosMedicosPage() {
  const bomberos = await prisma.bombero.findMany({
    where: { estado: "ACTIVO" },
    orderBy: { apellidos: "asc" },
    include: {
      fichaMedica: true,
      evaluacionesSalud: { orderBy: { fecha: "desc" }, take: 1 },
    },
  });

  const aptos = bomberos.filter((b) => b.fichaMedica?.aptitudOperativa === true).length;
  const noAptos = bomberos.filter((b) => b.fichaMedica?.aptitudOperativa === false).length;
  const sinFicha = bomberos.filter((b) => !b.fichaMedica).length;

  return (
    <div className="space-y-6">
      <PageHeader icon={HeartPulse} title="Registros Médicos" subtitle={`${bomberos.length} bomberos activos`} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CheckCircle} label="Aptos Operativos" value={aptos} accent="green" />
        <StatCard icon={XCircle} label="No Aptos / Restricc." value={noAptos} accent="red" />
        <StatCard icon={AlertTriangle} label="Sin Ficha Médica" value={sinFicha} accent="yellow" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Bombero", "Grupo Sang.", "Alergias", "Última Evaluación", "Aptitud Operativa"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bomberos.map((b) => {
                const ultimaEval = b.evaluacionesSalud[0];
                const apto = b.fichaMedica?.aptitudOperativa;
                return (
                  <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${apto === false ? "bg-red-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{b.apellidos}, {b.nombres}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{b.cip} · {GRADO_LABELS[b.grado] ?? b.grado}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-gray-800 text-base">
                        {b.fichaMedica?.grupoSanguineo ?? b.grupoSanguineo ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">
                      {b.fichaMedica?.alergias ?? <span className="text-gray-300">Ninguna</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {ultimaEval ? (
                        <div>
                          <p className="text-gray-500">{new Date(ultimaEval.fecha).toLocaleDateString("es-PE")}</p>
                          <p className={`font-semibold mt-0.5 ${ultimaEval.resultado === "APTO" ? "text-green-700" : ultimaEval.resultado === "NO APTO" ? "text-red-700" : "text-amber-700"}`}>
                            {ultimaEval.resultado}
                          </p>
                        </div>
                      ) : <span className="text-gray-400">Sin evaluar</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {b.fichaMedica ? (
                        <StatusBadge
                          label={apto ? "APTO" : "NO APTO"}
                          color={apto ? "green" : "red"}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">Sin ficha</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
