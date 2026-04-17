import { Award, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

const certificaciones = [
  { id: "1", nombre: "Operador de Autobomba", entidadEmisora: "CGBVP", fechaEmision: "2024-03-10", fechaVencimiento: "2026-03-10", bombero: { nombres: "Carlos Alberto", apellidos: "Quispe Mamani", cip: "B-001", grado: "CAPITAN" } },
  { id: "2", nombre: "Primeros Auxilios Avanzados", entidadEmisora: "Cruz Roja Peruana", fechaEmision: "2025-01-15", fechaVencimiento: "2027-01-15", bombero: { nombres: "María Elena", apellidos: "Flores Ramos", cip: "B-002", grado: "TENIENTE" } },
  { id: "3", nombre: "Rescate Vehicular Nivel II", entidadEmisora: "CGBVP", fechaEmision: "2023-08-20", fechaVencimiento: "2026-05-01", bombero: { nombres: "Juan Pablo", apellidos: "Torres Huanca", cip: "B-003", grado: "SARGENTO_PRIMERO" } },
  { id: "4", nombre: "HAZMAT – Nivel Técnico", entidadEmisora: "NFPA Perú", fechaEmision: "2022-11-05", fechaVencimiento: "2025-11-05", bombero: { nombres: "Miguel Ángel", apellidos: "Paredes Cruz", cip: "B-007", grado: "SARGENTO_SEGUNDO" } },
  { id: "5", nombre: "Conducción de Vehículos de Emergencia", entidadEmisora: "MTC", fechaEmision: "2024-06-18", fechaVencimiento: null, bombero: { nombres: "Roberto Jesús", apellidos: "Chávez León", cip: "B-005", grado: "BOMBERO_PRIMERO" } },
  { id: "6", nombre: "Rescate en Altura – Nivel I", entidadEmisora: "CGBVP", fechaEmision: "2025-09-01", fechaVencimiento: "2027-09-01", bombero: { nombres: "Lucia Fernanda", apellidos: "Rojas Soto", cip: "B-006", grado: "BOMBERO_RASO" } },
  { id: "7", nombre: "Operaciones en Incendios Estructurales", entidadEmisora: "CGBVP", fechaEmision: "2023-04-12", fechaVencimiento: "2026-04-20", bombero: { nombres: "Sandra Patricia", apellidos: "Vega Castillo", cip: "B-008", grado: "ALFEREZ" } },
];

export default function CertificacionesPage() {
  const hoy = new Date();
  const en30 = new Date(hoy);
  en30.setDate(hoy.getDate() + 30);

  const vencidas = certificaciones.filter((c) => c.fechaVencimiento && new Date(c.fechaVencimiento) < hoy);
  const porVencer = certificaciones.filter((c) => c.fechaVencimiento && new Date(c.fechaVencimiento) <= en30 && new Date(c.fechaVencimiento) >= hoy);

  return (
    <div className="space-y-5">
      <PageHeader icon={Award} title="Certificaciones" subtitle={`${certificaciones.length} registradas`} />

      {(vencidas.length > 0 || porVencer.length > 0) && (
        <div className="space-y-2">
          {vencidas.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-sm text-red-800"><strong>{vencidas.length} certificación(es) vencida(s)</strong> — requieren renovación</p>
            </div>
          )}
          {porVencer.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800"><strong>{porVencer.length} certificación(es)</strong> vencen en los próximos 30 días</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["Bombero", "Certificación", "Entidad Emisora", "Fecha Emisión", "Vencimiento"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {certificaciones.map((c) => {
                const vencida = c.fechaVencimiento && new Date(c.fechaVencimiento) < hoy;
                const proxima = c.fechaVencimiento && new Date(c.fechaVencimiento) <= en30 && !vencida;
                return (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${vencida ? "bg-red-50" : proxima ? "bg-amber-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{c.bombero.apellidos}, {c.bombero.nombres}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.bombero.cip}</p>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{c.nombre}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{c.entidadEmisora}</td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(c.fechaEmision).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {c.fechaVencimiento ? (
                        <span className={`text-xs font-semibold ${vencida ? "text-red-600" : proxima ? "text-amber-600" : "text-gray-600"}`}>
                          {new Date(c.fechaVencimiento).toLocaleDateString("es-PE")}
                          {vencida && " — VENCIDO"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Sin vencimiento</span>
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
