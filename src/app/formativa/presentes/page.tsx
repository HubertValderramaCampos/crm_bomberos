import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ROLES_SUPERVISION_FORMATIVA } from "@/lib/roles";
import { PresentesFormativoClient } from "@/components/ui-custom/PresentesFormativoClient";

export default async function PresentesFormativoPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Solo jefatura, administración e instrucción ven quiénes están en la
  // compañía. Un aspirante/postulante que llegue aquí va a su propio inicio.
  if (!ROLES_SUPERVISION_FORMATIVA.includes(session.user.rol)) redirect("/formativa/inicio");

  return <PresentesFormativoClient />;
}
