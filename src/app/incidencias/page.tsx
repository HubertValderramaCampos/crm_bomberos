import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IncidenciasClient } from "@/components/ui-custom/IncidenciasClient";

export default async function IncidenciasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <IncidenciasClient />;
}
