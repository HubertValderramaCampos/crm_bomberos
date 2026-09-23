import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function hasSessionCookie(req: NextRequest): boolean {
  // next-auth v4 puede usar cualquiera de estos nombres
  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
  ];
  return cookieNames.some((name) => req.cookies.has(name));
}

// El rol PILOTO (choferes rentados) solo puede ver estas rutas.
const RUTAS_PERMITIDAS_PILOTO = ["/inicio", "/checklist", "/incidencias", "/reporte-piloto", "/operaciones/asistencias"];
const INICIO_PILOTO = "/inicio";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Siempre permitir: API auth, assets de Next.js y encuestas públicas
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/encuesta-publica") ||
    pathname.startsWith("/encuesta") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasSession = hasSessionCookie(req);
  const token = hasSession
    ? await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    : null;
  const esPiloto = token?.rol === "PILOTO";

  // Página de login
  if (pathname.startsWith("/login")) {
    // Si ya tiene cookie de sesión, ir a su destino por defecto
    if (hasSession) {
      return NextResponse.redirect(new URL(esPiloto ? INICIO_PILOTO : "/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Raíz: redirigir según estado
  if (pathname === "/") {
    if (!hasSession) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.redirect(new URL(esPiloto ? INICIO_PILOTO : "/dashboard", req.url));
  }

  // Cualquier ruta protegida sin sesión → login
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Pilotos: acceso restringido a Inicio, Checklist, Incidencias, Reporte Diario y Asistencias
  if (esPiloto && !RUTAS_PERMITIDAS_PILOTO.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL(INICIO_PILOTO, req.url));
  }

  // Con sesión: permitir todo (el RBAC lo maneja la página del servidor)
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$).*)"],
};
