import type { NextAuthOptions } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

export const authOptions: NextAuthOptions = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
      authorization: { params: { prompt: "login" } },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        (token as any).accessToken = account.access_token;
        (token as any).refreshToken = account.refresh_token;
        (token as any).expiresAt = account.expires_at;
        (token as any).idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = (token as any).accessToken;
      (session as any).idToken = (token as any).idToken;
      (session as any).refreshToken = (token as any).refreshToken;
      return session;
    },
  },
};
