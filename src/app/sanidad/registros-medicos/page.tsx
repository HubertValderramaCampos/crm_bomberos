import { HeartPulse } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default function RegistrosMedicosPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={HeartPulse} title="Registros Médicos" subtitle="Fichas médicas y evaluaciones" />
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Sin registros aún.</p>
      </div>
    </div>
  );
}
