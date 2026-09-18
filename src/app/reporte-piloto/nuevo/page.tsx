import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NuevoReportePilotoClient } from "@/components/ui-custom/NuevoReportePilotoClient";

export default async function NuevoReportePilotoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <NuevoReportePilotoClient />;
}
