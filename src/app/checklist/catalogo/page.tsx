import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { esRolJefe } from "@/lib/roles";
import { ChecklistCatalogoClient } from "@/components/ui-custom/ChecklistCatalogoClient";

export default async function ChecklistCatalogoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!esRolJefe(session.user.rol)) redirect("/checklist");

  return <ChecklistCatalogoClient />;
}
