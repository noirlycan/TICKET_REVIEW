import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/en/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname.startsWith("/api/")) return true;
      const localeMatch = pathname.match(/^\/(en|vi)(\/|$)/);
      const locale = localeMatch?.[1] ?? "en";
      const pathWithoutLocale = localeMatch
        ? pathname.slice(locale.length + 1) || "/"
        : pathname;
      const isPublic =
        pathWithoutLocale === "/login" ||
        pathWithoutLocale.startsWith("/login/");
      if (isPublic) return true;
      return !!auth;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = token.name ?? undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
