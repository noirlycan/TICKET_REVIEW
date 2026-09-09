import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const localeMatch = pathname.match(/^\/(en|vi)(\/|$)/);
  const locale = localeMatch?.[1] ?? "en";
  const pathWithoutLocale = localeMatch
    ? pathname.slice(locale.length + 1) || "/"
    : pathname;

  const isLogin =
    pathWithoutLocale === "/login" || pathWithoutLocale.startsWith("/login/");

  if (!req.auth && !isLogin) {
    const loginUrl = new URL(`/${locale}/login`, req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && isLogin) {
    return NextResponse.redirect(new URL(`/${locale}/tasks`, req.nextUrl.origin));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
