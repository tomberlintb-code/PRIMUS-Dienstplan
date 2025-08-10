import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// statische Assets durchlassen
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Diese Pfade nicht anfassen
  if (
    pathname === '/' ||                          // Splash selbst
    pathname.startsWith('/_next') ||             // Next intern
    pathname.startsWith('/api') ||               // API
    PUBLIC_FILE.test(pathname)                   // statische Dateien
  ) {
    return NextResponse.next();
  }

  // Wenn der Request vom Splash kommt, durchlassen
  if (searchParams.get('fromSplash') === '1') {
    return NextResponse.next();
  }

  // Alle anderen ersten Einstiege -> Splash umleiten
  const url = req.nextUrl.clone();
  url.pathname = '/';
  // Zielseite merken (inkl. Query) für den Rücksprung
  url.searchParams.set('next', pathname + (req.nextUrl.search || ''));
  return NextResponse.redirect(url);
}

// (Optional) Matcher anpassen, falls du weitere Ordner hast
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
