import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSessionCookie(req: NextRequest): boolean {
  // next-auth v4 puede usar cualquiera de estos nombres
  const cookieNames = [
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "__Host-next-auth.session-token",
  ];
  return cookieNames.some((name) => req.cookies.has(name));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Siempre permitir: API auth y assets de Next.js
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const hasSession = hasSessionCookie(req);

  // Página de login
  if (pathname.startsWith("/login")) {
    // Si ya tiene cookie de sesión, ir al dashboard
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Raíz: redirigir según estado
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(hasSession ? "/dashboard" : "/login", req.url)
    );
  }

  // Cualquier ruta protegida sin sesión → login
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Con sesión: permitir todo (el RBAC lo maneja la página del servidor)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$).*)"],
};
