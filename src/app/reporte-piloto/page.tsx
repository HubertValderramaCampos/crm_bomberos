import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportePilotoClient } from "@/components/ui-custom/ReportePilotoClient";

export default async function ReportePilotoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <ReportePilotoClient />;
}
