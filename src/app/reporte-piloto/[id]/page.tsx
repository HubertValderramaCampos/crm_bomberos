import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportePilotoDetalleClient } from "@/components/ui-custom/ReportePilotoDetalleClient";

export default async function ReportePilotoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  return <ReportePilotoDetalleClient reporteId={id} />;
}
