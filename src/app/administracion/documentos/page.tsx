import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default function DocumentosPage() {
  return (
    <div className="space-y-4 pb-6">
      <PageHeader icon={FileText} title="Documentos" subtitle="Gestión de documentos institucionales" />
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Sin registros aún.</p>
      </div>
    </div>
  );
}
