"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Truck,
  Wrench,
  Package,
  BookOpen,
  Award,
  HeartPulse,
  Pill,
  Siren,
  CalendarDays,
  BarChart3,
  Megaphone,
  CalendarCheck,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Boxes,
} from "lucide-react";
import { ROL_LABELS } from "@/lib/permissions";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
};

const NAV_SECTIONS = [
  {
    title: "General",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["JEFE_COMPANIA", "ADMINISTRACION", "SERVICIOS_GENERALES", "INSTRUCCION", "SANIDAD", "OPERACIONES", "IMAGEN"] },
    ] as NavItem[],
  },
  {
    title: "Administración",
    roles: ["JEFE_COMPANIA", "ADMINISTRACION"],
    items: [
      { label: "Personal", href: "/administracion/personal", icon: Users, roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
      { label: "Documentos", href: "/administracion/documentos", icon: FileText, roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
      { label: "Presupuesto", href: "/administracion/presupuesto", icon: DollarSign, roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
    ] as NavItem[],
  },
  {
    title: "Servicios Generales",
    roles: ["JEFE_COMPANIA", "SERVICIOS_GENERALES"],
    items: [
      { label: "Vehículos", href: "/servicios-generales/vehiculos", icon: Truck, roles: ["JEFE_COMPANIA", "SERVICIOS_GENERALES"] },
      { label: "Equipos", href: "/servicios-generales/equipos", icon: Boxes, roles: ["JEFE_COMPANIA", "SERVICIOS_GENERALES"] },
      { label: "Mantenimiento", href: "/servicios-generales/mantenimiento", icon: Wrench, roles: ["JEFE_COMPANIA", "SERVICIOS_GENERALES"] },
      { label: "Inventario", href: "/servicios-generales/inventario", icon: Package, roles: ["JEFE_COMPANIA", "SERVICIOS_GENERALES"] },
    ] as NavItem[],
  },
  {
    title: "Instrucción",
    roles: ["JEFE_COMPANIA", "INSTRUCCION"],
    items: [
      { label: "Cursos", href: "/instruccion/cursos", icon: BookOpen, roles: ["JEFE_COMPANIA", "INSTRUCCION"] },
      { label: "Certificaciones", href: "/instruccion/certificaciones", icon: Award, roles: ["JEFE_COMPANIA", "INSTRUCCION"] },
    ] as NavItem[],
  },
  {
    title: "Sanidad",
    roles: ["JEFE_COMPANIA", "SANIDAD"],
    items: [
      { label: "Registros Médicos", href: "/sanidad/registros-medicos", icon: HeartPulse, roles: ["JEFE_COMPANIA", "SANIDAD"] },
      { label: "Botiquín", href: "/sanidad/botiquin", icon: Pill, roles: ["JEFE_COMPANIA", "SANIDAD"] },
    ] as NavItem[],
  },
  {
    title: "Operaciones",
    roles: ["JEFE_COMPANIA", "OPERACIONES"],
    items: [
      { label: "Emergencias", href: "/operaciones/emergencias", icon: Siren, roles: ["JEFE_COMPANIA", "OPERACIONES"] },
      { label: "Guardias", href: "/operaciones/guardias", icon: CalendarDays, roles: ["JEFE_COMPANIA", "OPERACIONES"] },
      { label: "Estadísticas", href: "/operaciones/estadisticas", icon: BarChart3, roles: ["JEFE_COMPANIA", "OPERACIONES"] },
    ] as NavItem[],
  },
  {
    title: "Imagen",
    roles: ["JEFE_COMPANIA", "IMAGEN"],
    items: [
      { label: "Comunicados", href: "/imagen/comunicados", icon: Megaphone, roles: ["JEFE_COMPANIA", "IMAGEN"] },
      { label: "Eventos", href: "/imagen/eventos", icon: CalendarCheck, roles: ["JEFE_COMPANIA", "IMAGEN"] },
    ] as NavItem[],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rol = session?.user?.rol ?? "";

  return (
    <div className="flex flex-col h-full w-64 bg-[#111827] text-white">
      {/* Logo header */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <Image
          src="/LOGO_150.png"
          alt="CIA 150"
          width={48}
          height={48}
          className="rounded-full shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-snug truncate font-[family-name:var(--font-heading)]">
            Bomberos Puente Piedra
          </p>
          <p className="text-xs text-gray-400 leading-snug truncate mt-0.5">
            Cía. N.° 150 — CGBVP
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_SECTIONS.map((section) => {
          // Filter items by role
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(rol)
          );
          // Check if section is accessible
          if (section.roles && !section.roles.includes(rol)) return null;
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-1">
              {section.title !== "General" && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  {section.title}
                </p>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group ${
                      active
                        ? "bg-red-700 text-white font-medium"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {active && (
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white leading-tight truncate">
              {session?.user?.nombres ?? "Usuario"}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight truncate mt-0.5">
              {ROL_LABELS[rol as keyof typeof ROL_LABELS] ?? rol}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
