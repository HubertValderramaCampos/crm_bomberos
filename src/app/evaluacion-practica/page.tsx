import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EvaluacionPracticaClient } from "@/components/ui-custom/EvaluacionPracticaClient";

export default async function EvaluacionPracticaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <EvaluacionPracticaClient />;
}
