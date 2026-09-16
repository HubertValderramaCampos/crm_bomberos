import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EvaluacionPracticaDetalleClient } from "@/components/ui-custom/EvaluacionPracticaDetalleClient";

export default async function EvaluacionPracticaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  return <EvaluacionPracticaDetalleClient evaluacionId={id} />;
}
