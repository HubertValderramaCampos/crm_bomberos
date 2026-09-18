import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IncidenciaDetalleClient } from "@/components/ui-custom/IncidenciaDetalleClient";

export default async function IncidenciaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  return <IncidenciaDetalleClient reporteId={id} />;
}
