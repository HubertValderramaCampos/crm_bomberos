"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Home, UserCircle, Radio, BarChart3, FileText, Users,
  ShoppingBag, GraduationCap, CalendarCheck,
  LogOut, ChevronRight, ShieldCheck, TrendingUp,
  Scroll, Gift, CalendarDays, Building2, ScanLine,
} from "lucide-react";
import { ROL_LABELS } from "@/lib/permissions";

type NavItem = { label: string; href: string; icon: React.ElementType; roles: string[] };
type NavSection = { title: string; roles?: string[]; items: NavItem[] };

const TODOS = ["JEFE_COMPANIA","ADMINISTRACION","SERVICIOS_GENERALES","INSTRUCCION","SANIDAD","OPERACIONES","IMAGEN","BOMBERO"];
const OPERATIVOS = ["JEFE_COMPANIA","OPERACIONES"];
const OPERATIVOS_Y_BOMBERO = ["JEFE_COMPANIA","OPERACIONES","BOMBERO"];

const NAV_SECTIONS: NavSection[] = [
  {
    title: "__root__",
    items: [
      { label: "Inicio",    href: "/inicio", icon: Home,       roles: TODOS },
      { label: "Mi Perfil", href: "/perfil", icon: UserCircle, roles: ["BOMBERO"] },
    ],
  },
  {
    title: "Gestión Operativa",
    roles: OPERATIVOS_Y_BOMBERO,
    items: [
      { label: "Operatividad",         href: "/dashboard",                icon: Radio,         roles: OPERATIVOS_Y_BOMBERO },
      { label: "Estadísticas",         href: "/operaciones/estadisticas", icon: TrendingUp,    roles: OPERATIVOS_Y_BOMBERO },
      { label: "Partes de Emergencia", href: "/operaciones/partes",       icon: FileText,      roles: OPERATIVOS_Y_BOMBERO },
      { label: "Bomberos",             href: "/operaciones/personal",     icon: Users,         roles: OPERATIVOS },
      { label: "Asistencias",          href: "/operaciones/asistencias",  icon: CalendarCheck, roles: OPERATIVOS_Y_BOMBERO },
      { label: "Análisis",             href: "/operaciones/analisis",     icon: BarChart3,     roles: OPERATIVOS_Y_BOMBERO },
    ],
  },
  {
    title: "Gestión Administrativa",
    roles: ["JEFE_COMPANIA", "ADMINISTRACION"],
    items: [
      { label: "Oficios Institucionales", href: "/administracion/oficios-institucionales", icon: Scroll,       roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
      { label: "Oficios Varios",          href: "/administracion/oficios-varios",          icon: FileText,     roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
      { label: "Donaciones",              href: "/administracion/donaciones",               icon: Gift,         roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
      { label: "Programación",            href: "/administracion/programacion",             icon: CalendarDays, roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
      { label: "Entidades",               href: "/administracion/entidades",                icon: Building2,    roles: ["JEFE_COMPANIA", "ADMINISTRACION"] },
    ],
  },
  {
    title: "Documentos",
    items: [
      { label: "Subir Documento",  href: "/solicitar-capacitacion",  icon: ScanLine,  roles: TODOS },
    ],
  },
  {
    title: "Gestión Comercial",
    items: [
      { label: "Próximamente", href: "#", icon: ShoppingBag, roles: TODOS },
    ],
  },
  {
    title: "Gestión Formativa",
    items: [
      { label: "Próximamente", href: "#", icon: GraduationCap, roles: TODOS },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rol = session?.user?.rol ?? "";
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);

  useEffect(() => {
    const rolesAdmin = ["JEFE_COMPANIA", "ADMINISTRACION"];
    if (!rolesAdmin.includes(rol)) return;
    function cargar() {
      fetch("/api/solicitudes-capacitacion/pendientes")
        .then(r => r.json())
        .then(d => setSolicitudesPendientes(d.count ?? 0))
        .catch(() => {});
    }
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [rol]);

  return (
    <div className="flex flex-col h-full w-64 bg-[#111827] text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <Image src="/LOGO_150.png" alt="CIA 150" width={48} height={48} className="rounded-full shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-snug truncate font-[family-name:var(--font-heading)]">
            Bomberos Puente Piedra
          </p>
          <p className="text-xs text-gray-400 leading-snug truncate mt-0.5">Cía. N.° 150 — CGBVP</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_SECTIONS.map((section) => {
          const sectionRoles = section.roles;
          if (sectionRoles && !sectionRoles.includes(rol)) return null;

          const visibleItems = section.items.filter(item => item.roles.includes(rol));
          if (visibleItems.length === 0) return null;

          const isRoot = section.title === "__root__";

          return (
            <div key={section.title}>
              {!isRoot && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  {section.title}
                </p>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isPlaceholder = item.href === "#";
                const active = !isPlaceholder && (
                  pathname === item.href ||
                  (item.href !== "/inicio" && item.href !== "/perfil" && pathname.startsWith(item.href))
                );

                if (isPlaceholder) {
                  return (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 cursor-default"
                    >
                      <Icon className="w-4 h-4 shrink-0 opacity-40" />
                      <span className="flex-1 opacity-40">{item.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded font-medium">Pronto</span>
                    </div>
                  );
                }

                const tourAttr = item.href === "/dashboard" ? "nav-operatividad"
                  : item.href === "/perfil" ? "nav-perfil"
                  : undefined;
                const esScanear = item.href === "/solicitar-capacitacion" && ["JEFE_COMPANIA","ADMINISTRACION"].includes(rol);
                const badge = esScanear && solicitudesPendientes > 0 ? solicitudesPendientes : 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    {...(tourAttr ? { "data-tour": tourAttr } : {})}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group ${
                      active
                        ? "bg-red-700 text-white font-medium"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-gray-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                    {active && !badge && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer usuario */}
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
