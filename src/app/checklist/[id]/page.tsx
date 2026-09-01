import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChecklistDetalleClient } from "@/components/ui-custom/ChecklistDetalleClient";

export default async function ChecklistDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  return <ChecklistDetalleClient registroId={id} />;
}
