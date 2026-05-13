import { Truck } from "lucide-react";
import { PageHeader } from "@/components/ui-custom/PageHeader";

export default function VehiculosPage() {
  return (
    <div className="space-y-5">
      <PageHeader icon={Truck} title="Vehículos" subtitle="Estado operativo de unidades" />
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center py-20">
        <p className="text-sm text-gray-400">Sin registros aún.</p>
      </div>
    </div>
  );
}
