import { NextResponse, NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/no-access"];
const SYSTEM_PREFIXES = ["/_next", "/favicon", "/assets", "/public", "/api"];

function isSystemPath(pathname: string) {
  return SYSTEM_PREFIXES.some((p) => pathname.startsWith(p));
}

function getRoleFromCookie(req: NextRequest): "user" | "admin" | "superadmin" | "none" {
  const role = req.cookies.get("role")?.value || "none";
  if (role === "user" || role === "admin" || role === "superadmin") return role;
  return "none";
}

function isAllowed(pathname: string, role: "user" | "admin" | "superadmin" | "none"): boolean {
  if (PUBLIC_PATHS.includes(pathname) || isSystemPath(pathname)) return true;
  if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);

  const userAllowed = ["/dashboard", "/dienstplan", "/urlaub", "/logout"];
  const adminExtra = ["/personalabteilung", "/archiv"];
  const superOnly = ["/konfiguration"];

  if (role === "superadmin") return true;
  if (role === "admin") {
    if (superOnly.some((p) => pathname.startsWith(p))) return false;
    return userAllowed.concat(adminExtra).some((p) => pathname.startsWith(p));
  }
  if (role === "user") {
    return userAllowed.some((p) => pathname.startsWith(p));
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = getRoleFromCookie(req);

  if (PUBLIC_PATHS.includes(pathname) || isSystemPath(pathname)) {
    return NextResponse.next();
  }

  if (role === "none") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("r", pathname);
    return NextResponse.redirect(url);
  }

  if (!isAllowed(pathname, role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/no-access";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)).*)"],
};
