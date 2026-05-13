import { Pill } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default function BotiquinPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Pill} title="Botiquín" subtitle="Inventario de materiales médicos" />
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Sin registros aún.</p>
      </div>
    </div>
  );
}
