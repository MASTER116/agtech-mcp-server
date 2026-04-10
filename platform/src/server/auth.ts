import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Автовход — без проверки пароля для MVP
        const email = (credentials?.email as string) || "demo@azat.farm";

        const user = await (db as any).user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: { org: true },
              take: 1,
            },
          },
        });

        if (!user) {
          // Если пользователь не найден — берём первого
          const firstUser = await (db as any).user.findFirst({
            include: { memberships: { include: { org: true }, take: 1 } },
          });
          if (!firstUser) return null;
          return {
            id: firstUser.id,
            email: firstUser.email,
            name: firstUser.name,
            image: firstUser.avatarUrl,
          };
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const membership = await (db as any).orgMember.findFirst({
          where: { userId: user.id! },
          include: { org: true },
          orderBy: { joinedAt: "asc" },
        });
        if (membership) {
          token.orgId = membership.orgId;
          token.orgRole = membership.role;
          token.orgName = membership.org.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.orgId = token.orgId as string;
        session.user.orgRole = token.orgRole as string;
        session.user.orgName = token.orgName as string;
      }
      return session;
    },
  },
});
