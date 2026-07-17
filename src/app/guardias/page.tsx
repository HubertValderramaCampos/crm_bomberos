import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { GuardiasClient } from "@/components/ui-custom/GuardiasClient";

export default async function GuardiasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return <GuardiasClient />;
}
