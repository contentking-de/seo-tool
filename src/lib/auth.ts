import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;
          const user = await prisma.user.findUnique({ where: { email: credentials.email } });
          if (!user) {
            if (process.env.NEXTAUTH_DEBUG === "true") {
              console.warn("[auth][debug] authorize: user_not_found", credentials.email);
            }
            return null;
          }
          const valid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!valid) {
            if (process.env.NEXTAUTH_DEBUG === "true") {
              console.warn("[auth][debug] authorize: password_mismatch for", credentials.email);
            }
            return null;
          }
          if (process.env.NEXTAUTH_DEBUG === "true") {
            console.log("[auth][debug] authorize: success for", credentials.email);
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          };
        } catch (err) {
          console.error("[auth][error] authorize failed", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: "ADMIN" | "USER" }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id ?? "") as string;
        (session.user as { role?: "ADMIN" | "USER" }).role = token.role as
          | "ADMIN"
          | "USER"
          | undefined;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        // Only allow same-origin redirects
        const target = new URL(url, baseUrl);
        if (target.origin !== new URL(baseUrl).origin) return baseUrl;
        // Prevent recursive redirects to the login page
        if (target.pathname === "/login") return `${baseUrl}/dashboard`;
        return target.toString();
      } catch {
        return baseUrl;
      }
    },
  },
};


