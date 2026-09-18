import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NuevoIncidenteClient } from "@/components/ui-custom/NuevoIncidenteClient";

export default async function NuevoIncidentePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <NuevoIncidenteClient />;
}
