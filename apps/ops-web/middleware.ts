import { NextResponse, type NextRequest } from 'next/server';

import { AUTH_COOKIE_ACCESS_TOKEN, AUTH_COOKIE_ROLE, isRoleAllowed } from './src/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 允许登录页与 Next 静态资源
  if (pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(AUTH_COOKIE_ACCESS_TOKEN)?.value;
  const role = request.cookies.get(AUTH_COOKIE_ROLE)?.value;

  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (!isRoleAllowed(role)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'forbidden');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

