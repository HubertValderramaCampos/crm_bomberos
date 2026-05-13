import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default function MantenimientoPage() {
  return (
    <div className="space-y-5">
      <PageHeader icon={Wrench} title="Mantenimiento" subtitle="Registro de mantenimientos programados" />
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Sin registros aún.</p>
      </div>
    </div>
  );
}
