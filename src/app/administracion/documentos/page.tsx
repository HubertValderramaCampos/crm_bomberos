import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";

const TIPO_LABEL: Record<string, string> = {
  OFICIO: "Oficio", MEMORANDO: "Memorando", INFORME: "Informe",
  RESOLUCION: "Resolución", ACTA: "Acta", CONVENIO: "Convenio", OTRO: "Otro",
};
const ESTADO_COLOR: Record<string, "green"|"yellow"|"gray"> = {
  PUBLICADO: "green", BORRADOR: "yellow", ARCHIVADO: "gray",
};

const docs = [
  { id: "1", numero: "OF-001-2026", titulo: "Oficio de solicitud de presupuesto", tipo: "OFICIO", fechaEmision: "2026-04-10", estado: "PUBLICADO", descripcion: "Solicitud al Ministerio del Interior" },
  { id: "2", numero: "MEM-002-2026", titulo: "Memorando interno sobre guardias", tipo: "MEMORANDO", fechaEmision: "2026-04-08", estado: "PUBLICADO", descripcion: null },
  { id: "3", numero: "INF-003-2026", titulo: "Informe mensual de operaciones marzo", tipo: "INFORME", fechaEmision: "2026-04-01", estado: "PUBLICADO", descripcion: "Resumen de actividades del mes de marzo" },
  { id: "4", numero: null, titulo: "Acta de reunión de coordinación", tipo: "ACTA", fechaEmision: "2026-03-28", estado: "BORRADOR", descripcion: null },
  { id: "5", numero: "RES-001-2026", titulo: "Resolución de nombramiento de jefe de guardia", tipo: "RESOLUCION", fechaEmision: "2026-03-15", estado: "PUBLICADO", descripcion: null },
  { id: "6", numero: "OF-005-2025", titulo: "Oficio de agradecimiento a municipalidad", tipo: "OFICIO", fechaEmision: "2025-12-20", estado: "ARCHIVADO", descripcion: null },
  { id: "7", numero: null, titulo: "Convenio de cooperación con hospital regional", tipo: "CONVENIO", fechaEmision: "2026-02-14", estado: "BORRADOR", descripcion: "Pendiente de firma" },
];

export default function DocumentosPage() {
  return (
    <div>
      <PageHeader icon={FileText} title="Documentos" subtitle={`${docs.length} documentos registrados`} />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {["N.° / Referencia", "Título", "Tipo", "Fecha de emisión", "Estado"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{d.numero ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{d.titulo}</p>
                    {d.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{d.descripcion}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{TIPO_LABEL[d.tipo] ?? d.tipo}</td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(d.fechaEmision).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge label={d.estado} color={ESTADO_COLOR[d.estado] ?? "gray"} />
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
