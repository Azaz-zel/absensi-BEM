import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { DEMO_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookie";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const AREAS = [
  { prefix: "/admin", login: "/admin/login", home: "/admin" },
  { prefix: "/proker", login: "/proker/masuk", home: "/proker" },
];

function areaFor(pathname: string) {
  return AREAS.find(
    (area) => pathname === area.prefix || pathname.startsWith(`${area.prefix}/`),
  );
}

function loginUrl(request: NextRequest, login: string, next: string) {
  const url = request.nextUrl.clone();
  url.pathname = login;
  url.search = "";
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

/** Carry refreshed auth cookies onto a redirect response. */
function withCookies(
  redirect: NextResponse,
  source: NextResponse,
): NextResponse {
  source.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const area = areaFor(pathname);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // No auth backend. Only the explicit demo flag may open a panel.
    if (DEMO_MODE || !area || pathname === area.login) {
      return NextResponse.next();
    }
    return loginUrl(request, area.login, pathname);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...AUTH_COOKIE_OPTIONS, ...options }),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (area && pathname !== area.login && !user) {
    return withCookies(loginUrl(request, area.login, pathname), response);
  }

  if (area && pathname === area.login && user) {
    const url = request.nextUrl.clone();
    url.pathname = area.home;
    url.search = "";
    return withCookies(NextResponse.redirect(url), response);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/proker/:path*"],
};
