"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Home, UserCircle, Radio, BarChart3, FileText, Users,
  GraduationCap, CalendarCheck, BookOpen, Stethoscope, Clock,
  LogOut, ChevronRight, ShieldCheck, TrendingUp,
  Scroll, Gift, CalendarDays, Building2, ScanLine, ChevronDown, Lock,
  Briefcase, Tag, Heart, ClipboardList,
} from "lucide-react";
import { ROL_LABELS } from "@/lib/permissions";

type NavItem = { label: string; href: string; icon: React.ElementType; roles: string[]; seccion?: string; rachaMin?: number };
type NavSection = { title: string; roles?: string[]; items: NavItem[] };

const TODOS = ["JEFE_COMPANIA","ADMINISTRACION","SERVICIOS_GENERALES","INSTRUCCION","SANIDAD","OPERACIONES","IMAGEN","BOMBERO"];
const OPERATIVOS = ["JEFE_COMPANIA","OPERACIONES"];
const OPERATIVOS_Y_BOMBERO = ["JEFE_COMPANIA","OPERACIONES","BOMBERO"];
const ADMIN_Y_BOMBERO_RACHA = ["JEFE_COMPANIA","ADMINISTRACION","BOMBERO"];

// Roles que usan permisos individuales (cuentas de área sin bombero_id)
const ROLES_CON_PERMISOS = ["ADMINISTRACION","OPERACIONES","SERVICIOS_GENERALES","INSTRUCCION","SANIDAD","IMAGEN"];

const NAV_SECTIONS: NavSection[] = [
  {
    title: "__root__",
    items: [
      { label: "Inicio",        href: "/inicio",                      icon: Home,        roles: TODOS },
      { label: "Mi Perfil",     href: "/perfil",                      icon: UserCircle,  roles: ["BOMBERO"] },
      { label: "Programación",  href: "/administracion/programacion", icon: CalendarDays,roles: ADMIN_Y_BOMBERO_RACHA, seccion: "programacion", rachaMin: 4 },
    ],
  },
  {
    title: "Gestión Operativa",
    roles: TODOS,
    items: [
      { label: "Operatividad",         href: "/dashboard",                icon: Radio,         roles: OPERATIVOS_Y_BOMBERO,   seccion: "dashboard" },
      { label: "Estadísticas",         href: "/operaciones/estadisticas", icon: TrendingUp,    roles: OPERATIVOS_Y_BOMBERO,   seccion: "estadisticas" },
      { label: "Partes de Emergencia", href: "/operaciones/partes",       icon: FileText,      roles: OPERATIVOS_Y_BOMBERO,   seccion: "partes" },
      { label: "Bomberos",             href: "/operaciones/personal",     icon: Users,         roles: OPERATIVOS,             seccion: "personal" },
      { label: "Asistencias",          href: "/operaciones/asistencias",  icon: CalendarCheck, roles: OPERATIVOS_Y_BOMBERO,   seccion: "asistencias" },
      { label: "Análisis",             href: "/operaciones/analisis",     icon: BarChart3,     roles: OPERATIVOS_Y_BOMBERO,   seccion: "analisis" },
      { label: "Eval. de Emergencias",  href: "/operaciones/aph",          icon: Stethoscope,   roles: ["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO"], seccion: "aph" },
    ],
  },
  {
    title: "Gestión Administrativa",
    roles: TODOS,
    items: [
      { label: "Oficios Institucionales", href: "/administracion/oficios-institucionales", icon: Scroll,       roles: ["JEFE_COMPANIA", "ADMINISTRACION"],          seccion: "oficios-institucionales" },
      { label: "Oficios Varios",          href: "/administracion/oficios-varios",          icon: FileText,     roles: ["JEFE_COMPANIA", "ADMINISTRACION"],          seccion: "oficios-varios" },
      { label: "Subir Documento",         href: "/solicitar-capacitacion",                 icon: ScanLine,     roles: TODOS,                                        seccion: "solicitar-capacitacion" },
      { label: "Ver Documentos",          href: "/documentos",                             icon: FileText,     roles: TODOS,                                        seccion: "documentos" },
      { label: "Donaciones",              href: "/administracion/donaciones",               icon: Gift,         roles: ADMIN_Y_BOMBERO_RACHA,                        seccion: "donaciones",   rachaMin: 4 },
      { label: "Asistencias a eventos",   href: "/administracion/asistencias-eventos",      icon: CalendarCheck,roles: ["JEFE_COMPANIA", "ADMINISTRACION"],          seccion: "programacion" }, // misma seccion que Programación → se habilitan juntas
      { label: "Entidades",               href: "/administracion/entidades",                icon: Building2,    roles: ["JEFE_COMPANIA", "ADMINISTRACION"],          seccion: "entidades" },
      { label: "Permisos",                href: "/administracion/permisos",                 icon: Lock,         roles: ["JEFE_COMPANIA"],                            seccion: "permisos" },
    ],
  },
  {
    title: "Gestión Comercial",
    roles: TODOS,
    items: [
      { label: "Socios Estratégicos",     href: "/comercial/socios",             icon: Briefcase,     roles: ["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO"], seccion: "socios" },
      { label: "Clasificación de Socios", href: "/comercial/clasificacion",      icon: Tag,           roles: ["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO"], seccion: "clasificacion" },
      { label: "Proyección Social",       href: "/comercial/proyeccion-social",  icon: Heart,         roles: ["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO"], seccion: "proyeccion-social" },
      { label: "Encuestas",               href: "/comercial/encuestas",          icon: ClipboardList, roles: ["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO"], seccion: "encuestas" },
    ],
  },
  {
    title: "Gestión Formativa",
    roles: ["JEFE_COMPANIA", "ADMINISTRACION", "BOMBERO", "INSTRUCCION"],
    items: [
      { label: "Mi progreso",        href: "/formativa/inicio",     icon: Home,          roles: ["BOMBERO"] },
      { label: "Registrar rostro",   href: "/formativa/entrenar",   icon: GraduationCap, roles: ["BOMBERO"] },
      { label: "Marcar asistencia",  href: "/formativa/asistencia", icon: CalendarCheck, roles: ["BOMBERO"] },

      { label: "Horarios",           href: "/formativa/horarios",   icon: Clock,         roles: ["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"], seccion: "horarios-formativa" },
      { label: "Reporte asistencias",href: "/formativa/reporte",    icon: BarChart3,     roles: ["JEFE_COMPANIA", "ADMINISTRACION", "INSTRUCCION"], seccion: "reporte-formativa"  },
    ],
  },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const rol       = session?.user?.rol ?? "";
  const categoria = session?.user?.categoria ?? "BOMBERO";
  const esFormativo = rol === "BOMBERO" && (categoria === "ASPIRANTE" || categoria === "POSTULANTE");
  const [solicitudesPendientes, setSolicitudesPendientes] = useState(0);
  // null = aún cargando, string[] = permisos cargados (vacío = sin permisos individuales asignados)
  const [misPermisos, setMisPermisos] = useState<string[] | null>(null);
  const [rachaAcceso, setRachaAcceso] = useState<number | null>(null);
  const [rachaConfig, setRachaConfig] = useState<Record<string, number> | null>(null);
  const [rachaListo,  setRachaListo]  = useState(false);

  const usaPermisosIndividuales = ROLES_CON_PERMISOS.includes(rol);

  function canSeeItem(item: NavItem): boolean {
    if (!item.roles.includes(rol)) return false;

    // Aspirantes y postulantes solo ven Gestión Formativa (no las demás secciones)
    if (esFormativo) {
      const rutasFormativas = ["/formativa/inicio", "/formativa/entrenar", "/formativa/asistencia"];
      return rutasFormativas.includes(item.href);
    }

    // Para bomberos: racha mínima desde BD (con fallback al rachaMin hardcodeado)
    if (rol === "BOMBERO") {
      if (!rachaListo) return false; // aún cargando
      const racha  = rachaAcceso ?? 0;
      const config = rachaConfig ?? {};
      const seccion = item.seccion;
      const minReq = (seccion !== undefined && config[seccion] !== undefined)
        ? config[seccion]
        : (item.rachaMin ?? 0);
      if (minReq === -1) return false; // bloqueado explícitamente (Nunca)
      return racha >= minReq;
    }

    // Cuentas de área usan permisos individuales (solo restringen, no habilitan)
    if (usaPermisosIndividuales) {
      if (misPermisos === null) return false; // aún cargando
      if (misPermisos.length === 0) return true; // sin restricciones → acceso completo del rol
      if (!item.seccion) return true;
      if (item.href === "/inicio") return true;
      return misPermisos.includes(item.seccion);
    }

    return true;
  }

  function getSectionWithActive(r: string): string | null {
    for (const sec of NAV_SECTIONS) {
      if (sec.title === "__root__") continue;
      for (const item of sec.items) {
        if (item.href !== "#" && (r === item.href || (item.href !== "/inicio" && item.href !== "/perfil" && r.startsWith(item.href)))) {
          return sec.title;
        }
      }
    }
    return null;
  }

  const [openSection, setOpenSection] = useState<string | null>(() => getSectionWithActive(pathname));

  useEffect(() => {
    const sec = getSectionWithActive(pathname);
    if (sec) setOpenSection(sec);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Cargar permisos individuales si aplica
  useEffect(() => {
    if (!usaPermisosIndividuales) { setMisPermisos([]); return; }
    fetch("/api/usuarios/mis-permisos")
      .then(r => r.json())
      .then(d => setMisPermisos(Array.isArray(d) ? d : []))
      .catch(() => setMisPermisos([]));
  }, [usaPermisosIndividuales]);

  // Cargar racha y config de acceso para bomberos
  useEffect(() => {
    if (!rol) return; // sesión aún cargando, esperar
    if (rol !== "BOMBERO" || esFormativo) {
      setRachaAcceso(0);
      setRachaConfig({});
      setRachaListo(true);
      return;
    }
    Promise.all([
      fetch("/api/usuarios/racha-acceso").then(r => r.json()),
      fetch("/api/bombero-acceso-racha").then(r => r.json()),
    ]).then(([racha, config]) => {
      setRachaAcceso(racha.rachaActual ?? 0);
      const map: Record<string, number> = {};
      if (Array.isArray(config)) {
        for (const row of config) map[row.seccion] = row.racha_min;
      }
      setRachaConfig(map);
      setRachaListo(true);
    }).catch(() => {
      setRachaAcceso(0);
      setRachaConfig({});
      setRachaListo(true);
    });
  }, [rol]);

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

  function toggleSection(title: string) {
    setOpenSection(prev => prev === title ? null : title);
  }

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
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_SECTIONS.map((section) => {
          const sectionRoles = section.roles;
          if (sectionRoles && !sectionRoles.includes(rol)) return null;

          const visibleItems = section.items.filter(item => canSeeItem(item));
          if (visibleItems.length === 0) return null;

          const isRoot = section.title === "__root__";
          const isOpen = isRoot || openSection === section.title;

          const hasActive = visibleItems.some(item =>
            item.href !== "#" && (pathname === item.href || (item.href !== "/inicio" && item.href !== "/perfil" && pathname.startsWith(item.href)))
          );

          return (
            <div key={section.title}>
              {!isRoot && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors mt-1 ${
                    hasActive
                      ? "text-white bg-white/5"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest">
                    {section.title}
                  </span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>
              )}

              {isOpen && (
                <div className={isRoot ? "" : "mt-0.5"}>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isPlaceholder = item.href === "#";
                    const active = !isPlaceholder && (
                      pathname === item.href ||
                      (item.href !== "/inicio" && item.href !== "/perfil" && pathname.startsWith(item.href))
                    );

                    if (isPlaceholder) {
                      return (
                        <div key={item.label} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-gray-600 cursor-default">
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
              )}
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
