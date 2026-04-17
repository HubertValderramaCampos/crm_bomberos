import { Users } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const GRADO_LABELS: Record<string, string> = {
  BOMBERO_RASO: "Bro. Raso", BOMBERO_PRIMERO: "Bro. 1.°", CABO: "Cabo",
  SARGENTO_SEGUNDO: "Sgto. 2.°", SARGENTO_PRIMERO: "Sgto. 1.°", ALFEREZ: "Alférez",
  TENIENTE: "Tte.", CAPITAN: "Cap.", MAYOR: "My.",
  TENIENTE_CORONEL: "Tte. Crnl.", CORONEL: "Crnl.", GENERAL: "Gral.",
};
const ESTADO_COLOR: Record<string, "green"|"gray"|"red"|"yellow"> = {
  ACTIVO: "green", INACTIVO: "gray", SUSPENDIDO: "red",
  BAJA_TEMPORAL: "yellow", BAJA_DEFINITIVA: "red",
};

const bomberos = [
  { id: "1", cip: "B-001", apellidos: "Quispe Mamani", nombres: "Carlos Alberto", grado: "CAPITAN", areaPrincipal: "OPERACIONES", fechaIngreso: "2010-03-15", estado: "ACTIVO", telefono: "987654321" },
  { id: "2", cip: "B-002", apellidos: "Flores Ramos", nombres: "María Elena", grado: "TENIENTE", areaPrincipal: "SANIDAD", fechaIngreso: "2013-07-20", estado: "ACTIVO", telefono: "976543210" },
  { id: "3", cip: "B-003", apellidos: "Torres Huanca", nombres: "Juan Pablo", grado: "SARGENTO_PRIMERO", areaPrincipal: "INSTRUCCION", fechaIngreso: "2015-01-10", estado: "ACTIVO", telefono: "965432109" },
  { id: "4", cip: "B-004", apellidos: "Mendoza Vargas", nombres: "Ana Lucía", grado: "CABO", areaPrincipal: "ADMINISTRACION", fechaIngreso: "2018-06-05", estado: "ACTIVO", telefono: null },
  { id: "5", cip: "B-005", apellidos: "Chávez León", nombres: "Roberto Jesús", grado: "BOMBERO_PRIMERO", areaPrincipal: "OPERACIONES", fechaIngreso: "2019-09-12", estado: "ACTIVO", telefono: "954321098" },
  { id: "6", cip: "B-006", apellidos: "Rojas Soto", nombres: "Lucia Fernanda", grado: "BOMBERO_RASO", areaPrincipal: "SERVICIOS_GENERALES", fechaIngreso: "2021-02-28", estado: "ACTIVO", telefono: "943210987" },
  { id: "7", cip: "B-007", apellidos: "Paredes Cruz", nombres: "Miguel Ángel", grado: "SARGENTO_SEGUNDO", areaPrincipal: "OPERACIONES", fechaIngreso: "2016-11-03", estado: "ACTIVO", telefono: "932109876" },
  { id: "8", cip: "B-008", apellidos: "Vega Castillo", nombres: "Sandra Patricia", grado: "ALFEREZ", areaPrincipal: "IMAGEN", fechaIngreso: "2017-04-18", estado: "ACTIVO", telefono: "921098765" },
  { id: "9", cip: "B-009", apellidos: "Salazar Pino", nombres: "Diego Armando", grado: "BOMBERO_PRIMERO", areaPrincipal: "OPERACIONES", fechaIngreso: "2020-08-22", estado: "INACTIVO", telefono: null },
  { id: "10", cip: "B-010", apellidos: "Gutiérrez Mora", nombres: "Patricia Rosa", grado: "CABO", areaPrincipal: "SANIDAD", fechaIngreso: "2019-03-14", estado: "BAJA_TEMPORAL", telefono: "910987654" },
];

export default function PersonalPage() {
  const activos = bomberos.filter((b) => b.estado === "ACTIVO").length;

  return (
    <div>
      <PageHeader
        icon={Users}
        title="Personal"
        subtitle={`${activos} bomberos activos · ${bomberos.length} registros totales`}
      />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["CIP", "Apellidos y Nombres", "Grado", "Área Principal", "Ingreso", "Estado"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bomberos.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400 font-medium">{b.cip}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-gray-900">{b.apellidos}, {b.nombres}</p>
                    {b.telefono && <p className="text-xs text-gray-400 mt-0.5">{b.telefono}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-sm">{GRADO_LABELS[b.grado] ?? b.grado}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{b.areaPrincipal?.replace(/_/g, " ") ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(b.fechaIngreso).toLocaleDateString("es-PE", { year: "numeric", month: "short" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={b.estado.replace(/_/g, " ")} color={ESTADO_COLOR[b.estado] ?? "gray"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
