import type { NextAuthConfig } from "next-auth";

// Configuración mínima para el middleware (compatible con Edge Runtime).
// NO importar bcryptjs, Prisma, ni ningún módulo Node.js aquí.
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/auth/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/auth");
      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
