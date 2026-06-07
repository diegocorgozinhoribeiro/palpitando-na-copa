import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

// Protege rotas privadas. A verificacao de admin acontece dentro das
// proprias paginas/actions de admin (precisa consultar o banco).
const PROTECTED = ["/jogos", "/ligas", "/ranking", "/perfil", "/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);
  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/jogos/:path*",
    "/ligas/:path*",
    "/ranking/:path*",
    "/perfil/:path*",
    "/admin/:path*",
  ],
};
